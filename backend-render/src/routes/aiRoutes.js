const express = require("express");
const { downloadStorageFile, createSignedLectureUpload } = require("../services/supabaseFileService");
const { extractTextFromFile, chunkText } = require("../services/fileExtractService");
const { generateTopicFromText, markWrittenAnswer } = require("../services/aiService");
const { createJob, updateJob, getJob } = require("../services/jobStore");

const router = express.Router();

const MAX_FILE_UPLOAD_MB = Number(process.env.MAX_FILE_UPLOAD_MB || 75);
const MAX_TOTAL_UPLOAD_MB = Number(process.env.MAX_TOTAL_UPLOAD_MB || 150);
const MAX_FILES_PER_IMPORT = Number(process.env.MAX_FILES_PER_IMPORT || 8);
const MAX_FILE_UPLOAD_BYTES = MAX_FILE_UPLOAD_MB * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_MB * 1024 * 1024;

function sendError(res, status, code, error, extra = {}) {
  const message = error?.message || String(error || "Unknown error.");
  console.error(`[${code}]`, message, extra);

  return res.status(status).json({
    success: false,
    code,
    error: message,
    ...extra
  });
}

function safeFileName(fileName = "lecture-file") {
  return String(fileName)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "lecture-file";
}

function formatMb(bytes = 0) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normaliseUploadedFiles(body = {}) {
  if (Array.isArray(body.files) && body.files.length) {
    return body.files.map((file) => ({
      bucket: file.bucket,
      filePath: file.filePath || file.path,
      fileName: file.fileName || file.name,
      mimeType: file.mimeType || file.type,
      sizeBytes: Number(file.sizeBytes || file.size || 0)
    }));
  }

  if (body.filePath) {
    return [{
      bucket: body.bucket,
      filePath: body.filePath,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: Number(body.sizeBytes || 0)
    }];
  }

  return [];
}

function validateUploadedFiles(files) {
  if (!files.length) {
    const error = new Error("Missing filePath/files. Upload at least one lecture file first.");
    error.code = "AI_001_MISSING_FILE_PATH";
    error.status = 400;
    throw error;
  }

  if (files.length > MAX_FILES_PER_IMPORT) {
    const error = new Error(`Too many files. The current limit is ${MAX_FILES_PER_IMPORT} files per AI import.`);
    error.code = "AI_002_TOO_MANY_FILES";
    error.status = 400;
    throw error;
  }

  files.forEach((file) => {
    if (!file.filePath) {
      const error = new Error("One uploaded file is missing filePath.");
      error.code = "AI_003_FILE_MISSING_PATH";
      error.status = 400;
      throw error;
    }

    if (file.sizeBytes && file.sizeBytes > MAX_FILE_UPLOAD_BYTES) {
      const error = new Error(`${file.fileName || file.filePath} is ${formatMb(file.sizeBytes)}. The per-file limit is ${MAX_FILE_UPLOAD_MB} MB.`);
      error.code = "AI_004_FILE_TOO_LARGE";
      error.status = 400;
      throw error;
    }
  });

  const declaredTotalBytes = files.reduce((total, file) => total + (Number(file.sizeBytes) || 0), 0);
  if (declaredTotalBytes && declaredTotalBytes > MAX_TOTAL_UPLOAD_BYTES) {
    const error = new Error(`The selected files are ${formatMb(declaredTotalBytes)} combined. The total limit per AI import is ${MAX_TOTAL_UPLOAD_MB} MB.`);
    error.code = "AI_005_TOTAL_UPLOAD_TOO_LARGE";
    error.status = 400;
    throw error;
  }
}

async function downloadAndExtractUploadedFiles(files) {
  const extractedFiles = [];
  let actualTotalBytes = 0;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileLabel = file.fileName || file.filePath;

    console.log("[AI_010_DOWNLOAD_START]", {
      index: index + 1,
      totalFiles: files.length,
      bucket: file.bucket,
      filePath: file.filePath,
      fileName: file.fileName
    });

    const buffer = await downloadStorageFile({
      bucket: file.bucket,
      filePath: file.filePath
    });

    actualTotalBytes += buffer.length;

    if (buffer.length > MAX_FILE_UPLOAD_BYTES) {
      const error = new Error(`${fileLabel} is ${formatMb(buffer.length)}. The per-file limit is ${MAX_FILE_UPLOAD_MB} MB.`);
      error.code = "AI_006_DOWNLOADED_FILE_TOO_LARGE";
      error.status = 400;
      throw error;
    }

    if (actualTotalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      const error = new Error(`The downloaded files are ${formatMb(actualTotalBytes)} combined. The total limit per AI import is ${MAX_TOTAL_UPLOAD_MB} MB.`);
      error.code = "AI_007_DOWNLOADED_TOTAL_TOO_LARGE";
      error.status = 400;
      throw error;
    }

    console.log("[AI_020_DOWNLOAD_DONE]", {
      filePath: file.filePath,
      bytes: buffer.length
    });

    const text = await extractTextFromFile({
      buffer,
      fileName: file.fileName,
      mimeType: file.mimeType
    });

    console.log("[AI_030_EXTRACT_DONE]", {
      fileName: file.fileName,
      extractedCharacters: text.length
    });

    extractedFiles.push({
      name: file.fileName || safeFileName(file.filePath),
      type: file.mimeType || "",
      size: buffer.length,
      text
    });
  }

  return extractedFiles;
}

function buildCombinedLectureText(extractedFiles) {
  return extractedFiles
    .map((file, index) => `SOURCE FILE ${index + 1}: ${file.name}\n----------------------------------------\n${file.text}`)
    .join("\n\n");
}

async function generateTopicFromUploadedFilePayload({ body, onProgress }) {
  const files = normaliseUploadedFiles(body);
  validateUploadedFiles(files);

  let extractedFiles;
  try {
    extractedFiles = await downloadAndExtractUploadedFiles(files);
  } catch (error) {
    error.code = error.code || "AI_011_STORAGE_OR_EXTRACT_FAILED";
    error.status = error.status || 500;
    throw error;
  }

  const combinedLectureText = buildCombinedLectureText(extractedFiles);
  const chunks = chunkText(combinedLectureText, 12000);

  if (!chunks.length) {
    const error = new Error("No text could be extracted from the uploaded file(s).");
    error.code = "AI_032_NO_TEXT_EXTRACTED";
    error.status = 400;
    throw error;
  }

  const sourceFiles = extractedFiles.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size
  }));

  const fileNameLabel = extractedFiles.map((file) => file.name).join(", ");

  console.log("[AI_040_GENERATION_START]", {
    provider: process.env.AI_PROVIDER || "openai",
    model: process.env.AI_PROVIDER === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL,
    files: extractedFiles.length,
    chunks: chunks.length,
    extractedCharacters: combinedLectureText.length
  });

  const topic = await generateTopicFromText({
    textChunks: chunks,
    topicName: body.topicName || fileNameLabel || "AI Generated Topic",
    fileName: fileNameLabel || "Uploaded files",
    sourceFiles,
    contentSettings: body.contentSettings,
    onProgress
  });

  console.log("[AI_050_GENERATION_DONE]", {
    topicName: topic.topicName,
    files: extractedFiles.length,
    flashcards: topic.flashcards?.length || 0,
    quizQuestions: topic.quizQuestions?.length || 0
  });

  return {
    topic: {
      ...topic,
      sourceFiles
    },
    meta: {
      fileCount: extractedFiles.length,
      chunkCount: chunks.length,
      extractedCharacters: combinedLectureText.length,
      sourceFiles
    }
  };
}

router.get("/debug/config", (req, res) => {
  res.json({
    success: true,
    config: {
      aiProvider: process.env.AI_PROVIDER || "openai",
      geminiModel: process.env.GEMINI_MODEL || null,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseUrl: process.env.SUPABASE_URL || null,
      supabaseUrlLooksValid: Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes("/rest/v1")),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      uploadBucket: process.env.SUPABASE_UPLOAD_BUCKET || "lecture-files",
      frontendOrigin: process.env.FRONTEND_ORIGIN || "",
      maxFileUploadMb: MAX_FILE_UPLOAD_MB,
      maxTotalUploadMb: MAX_TOTAL_UPLOAD_MB,
      maxFilesPerImport: MAX_FILES_PER_IMPORT
    }
  });
});

router.post("/storage/create-signed-upload", async (req, res) => {
  try {
    const {
      bucket,
      fileName,
      userId,
      subjectId
    } = req.body || {};

    if (!fileName) {
      return sendError(res, 400, "STORAGE_001_MISSING_FILE_NAME", "Missing fileName.");
    }

    if (!userId) {
      return sendError(res, 400, "STORAGE_002_MISSING_USER_ID", "Missing userId.");
    }

    if (!subjectId) {
      return sendError(res, 400, "STORAGE_003_MISSING_SUBJECT_ID", "Missing subjectId.");
    }

    const filePath = `${userId}/${subjectId}/${Date.now()}-${safeFileName(fileName)}`;

    console.log("[STORAGE_010_CREATE_SIGNED_UPLOAD]", {
      bucket: bucket || process.env.SUPABASE_UPLOAD_BUCKET || "lecture-files",
      filePath
    });

    const signedUpload = await createSignedLectureUpload({
      bucket,
      filePath
    });

    console.log("[STORAGE_020_SIGNED_UPLOAD_CREATED]", {
      filePath
    });

    return res.json({
      success: true,
      upload: signedUpload
    });
  } catch (error) {
    return sendError(res, 500, "STORAGE_900_CREATE_SIGNED_UPLOAD_FAILED", error);
  }
});


router.post("/mark-written-answer", async (req, res) => {
  try {
    const {
      question,
      expectedAnswer,
      markingPoints,
      maxMarks,
      userAnswer
    } = req.body || {};

    if (!question) {
      return sendError(res, 400, "AI_MARK_001_MISSING_QUESTION", "Missing question.");
    }

    if (!String(userAnswer || "").trim()) {
      return sendError(res, 400, "AI_MARK_002_MISSING_ANSWER", "Missing user answer.");
    }

    const result = await markWrittenAnswer({
      question,
      expectedAnswer,
      markingPoints,
      maxMarks,
      userAnswer
    });

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    return sendError(
      res,
      error.status || 500,
      error.code || "AI_MARK_999_UNEXPECTED_ERROR",
      error,
      {
        provider: process.env.AI_PROVIDER || "openai",
        model: process.env.AI_PROVIDER === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL
      }
    );
  }
});

router.post("/generate-topic-from-upload", async (req, res) => {
  try {
    const result = await generateTopicFromUploadedFilePayload({
      body: req.body || {}
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return sendError(
      res,
      error.status || 500,
      error.code || "AI_999_UNEXPECTED_ROUTE_ERROR",
      error,
      {
        provider: process.env.AI_PROVIDER || "openai",
        model: process.env.AI_PROVIDER === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL
      }
    );
  }
});

router.post("/jobs/generate-topic-from-upload", async (req, res) => {
  const job = createJob({
    status: "queued",
    progress: 0,
    message: "Queued AI generation job"
  });

  res.status(202).json({
    success: true,
    job
  });

  setImmediate(async () => {
    try {
      updateJob(job.jobId, {
        status: "running",
        progress: 5,
        message: "Downloading and extracting uploaded file(s)..."
      });

      const result = await generateTopicFromUploadedFilePayload({
        body: req.body || {},
        onProgress: (progressUpdate) => {
          updateJob(job.jobId, progressUpdate);
        }
      });

      updateJob(job.jobId, {
        status: "complete",
        progress: 100,
        message: "Topic generated.",
        result
      });
    } catch (error) {
      console.error("[JOB_900_FAILED]", error);

      updateJob(job.jobId, {
        status: "error",
        error: error.message || "AI generation failed.",
        message: "AI generation failed."
      });
    }
  });
});

router.get("/jobs/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      code: "JOB_404_NOT_FOUND",
      error: "Job not found."
    });
  }

  res.json({
    success: true,
    job
  });
});

module.exports = router;
