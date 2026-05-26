const express = require("express");
const { downloadStorageFile, createSignedLectureUpload } = require("../services/supabaseFileService");
const { extractTextFromFile, chunkText } = require("../services/fileExtractService");
const { generateTopicFromText } = require("../services/aiService");
const { createJob, updateJob, getJob } = require("../services/jobStore");

const router = express.Router();


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
      return res.status(400).json({
        success: false,
        error: "Missing fileName."
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId."
      });
    }

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        error: "Missing subjectId."
      });
    }

    const filePath = `${userId}/${subjectId}/${Date.now()}-${safeFileName(fileName)}`;
    const signedUpload = await createSignedLectureUpload({
      bucket,
      filePath
    });

    return res.json({
      success: true,
      upload: signedUpload
    });
  } catch (error) {
    console.error("Could not create signed upload:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Could not create signed upload."
    });
  }
});


router.post("/generate-topic-from-upload", async (req, res) => {
  try {
    const { bucket, filePath, fileName, mimeType, topicName } = req.body || {};

    const buffer = await downloadStorageFile({
      bucket,
      filePath
    });

    const extractedText = await extractTextFromFile({
      buffer,
      fileName,
      mimeType
    });

    const chunks = chunkText(extractedText, 12000);

    const topic = await generateTopicFromText({
      textChunks: chunks,
      topicName: topicName || fileName || "AI Generated Topic",
      fileName: fileName || filePath
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
    console.error("AI generation failed:", error);

    res.status(500).json({
      success: false,
      error: error.message || "AI generation failed."
    });
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
      console.error("AI generation job failed:", error);

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
      error: "Job not found."
    });
  }

  res.json({
    success: true,
    job
  });
});

module.exports = router;
