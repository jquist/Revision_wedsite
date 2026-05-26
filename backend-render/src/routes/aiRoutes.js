const express = require("express");
const { downloadStorageFile, createSignedLectureUpload } = require("../services/supabaseFileService");
const { extractTextFromFile, chunkText } = require("../services/fileExtractService");
const { generateTopicFromText } = require("../services/aiService");
const { createJob, updateJob, getJob } = require("../services/jobStore");

const router = express.Router();

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
      frontendOrigin: process.env.FRONTEND_ORIGIN || ""
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

router.post("/generate-topic-from-upload", async (req, res) => {
  try {
    const { bucket, filePath, fileName, mimeType, topicName } = req.body || {};

    if (!filePath) {
      return sendError(res, 400, "AI_001_MISSING_FILE_PATH", "Missing filePath.");
    }

    console.log("[AI_010_DOWNLOAD_START]", { bucket, filePath, fileName });

    let buffer;
    try {
      buffer = await downloadStorageFile({
        bucket,
        filePath
      });
    } catch (error) {
      return sendError(res, 500, "AI_011_STORAGE_DOWNLOAD_FAILED", error, { filePath });
    }

    console.log("[AI_020_DOWNLOAD_DONE]", {
      filePath,
      bytes: buffer.length
    });

    let extractedText;
    try {
      extractedText = await extractTextFromFile({
        buffer,
        fileName,
        mimeType
      });
    } catch (error) {
      return sendError(res, 500, "AI_021_FILE_EXTRACT_FAILED", error, { fileName, mimeType });
    }

    console.log("[AI_030_EXTRACT_DONE]", {
      fileName,
      extractedCharacters: extractedText.length
    });

    let chunks;
    try {
      chunks = chunkText(extractedText, 12000);
    } catch (error) {
      return sendError(res, 500, "AI_031_CHUNK_FAILED", error);
    }

    if (!chunks.length) {
      return sendError(res, 400, "AI_032_NO_TEXT_EXTRACTED", "No text could be extracted from the file.", {
        fileName,
        mimeType
      });
    }

    console.log("[AI_040_GENERATION_START]", {
      provider: process.env.AI_PROVIDER || "openai",
      model: process.env.AI_PROVIDER === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL,
      chunks: chunks.length
    });

    let topic;
    try {
      topic = await generateTopicFromText({
        textChunks: chunks,
        topicName: topicName || fileName || "AI Generated Topic",
        fileName: fileName || filePath
      });
    } catch (error) {
      return sendError(res, 500, "AI_041_AI_PROVIDER_FAILED", error, {
        provider: process.env.AI_PROVIDER || "openai",
        model: process.env.AI_PROVIDER === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL
      });
    }

    console.log("[AI_050_GENERATION_DONE]", {
      topicName: topic.topicName,
      flashcards: topic.flashcards?.length || 0,
      quizQuestions: topic.quizQuestions?.length || 0
    });

    res.json({
      success: true,
      topic,
      meta: {
        chunkCount: chunks.length,
        extractedCharacters: extractedText.length
      }
    });
  } catch (error) {
    return sendError(res, 500, "AI_999_UNEXPECTED_ROUTE_ERROR", error);
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
      const { bucket, filePath, fileName, mimeType, topicName } = req.body || {};

      updateJob(job.jobId, {
        status: "running",
        progress: 5,
        message: "Downloading uploaded file..."
      });

      const buffer = await downloadStorageFile({
        bucket,
        filePath
      });

      updateJob(job.jobId, {
        progress: 12,
        message: "Extracting file text..."
      });

      const extractedText = await extractTextFromFile({
        buffer,
        fileName,
        mimeType
      });

      const chunks = chunkText(extractedText, 12000);

      updateJob(job.jobId, {
        progress: 15,
        message: `Extracted text. Processing ${chunks.length} chunk(s)...`
      });

      const topic = await generateTopicFromText({
        textChunks: chunks,
        topicName: topicName || fileName || "AI Generated Topic",
        fileName: fileName || filePath,
        onProgress: (progressUpdate) => {
          updateJob(job.jobId, progressUpdate);
        }
      });

      updateJob(job.jobId, {
        status: "complete",
        progress: 100,
        message: "Topic generated.",
        result: {
          topic,
          meta: {
            chunkCount: chunks.length,
            extractedCharacters: extractedText.length
          }
        }
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
