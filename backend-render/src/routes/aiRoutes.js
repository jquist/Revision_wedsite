const express = require("express");
const { downloadStorageFile } = require("../services/supabaseFileService");
const { extractTextFromFile, chunkText } = require("../services/fileExtractService");
const { generateTopicFromText } = require("../services/aiService");
const { createJob, updateJob, getJob } = require("../services/jobStore");

const router = express.Router();

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
