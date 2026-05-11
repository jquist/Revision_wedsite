const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const multer = require("multer");
const requireAuth = require("../authMiddleware");
const { generateTopicFromLecture } = require("../ai/generateTopic");
const { extractTextFromUploadedFile } = require("../ai/fileTextExtractor");
const {
  SMALL_TEXT_LIMIT,
  getUploadChunkText,
  saveExtractedTextAsUpload
} = require("../ai/uploadStorage");

const router = express.Router();

const tempUploadDir = path.join(os.tmpdir(), "revision-app-uploads");

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, tempUploadDir);
    },
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      callback(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: {
    fileSize: 600 * 1024 * 1024
  }
});

router.post("/extract-file", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const text = await extractTextFromUploadedFile(req.file);

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        message: "The file was read, but not enough text could be extracted."
      });
    }

    const metadata = saveExtractedTextAsUpload({
      userId: req.user.userId,
      fileName: req.file.originalname,
      text
    });

    const isSmallEnoughForTextBox = text.length <= SMALL_TEXT_LIMIT;

    res.json({
      mode: isSmallEnoughForTextBox ? "text" : "chunks",
      fileName: req.file.originalname,
      uploadId: metadata.uploadId,
      characterCount: text.length,
      chunkCount: metadata.chunkCount,
      chunks: metadata.chunks,
      text: isSmallEnoughForTextBox ? text : ""
    });
  } catch (error) {
    console.error("File extraction failed:", error);
    res.status(400).json({
      message: error.message || "File extraction failed."
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

router.get("/uploads/:uploadId/chunks/:chunkIndex", requireAuth, (req, res) => {
  try {
    const result = getUploadChunkText(
      req.user.userId,
      req.params.uploadId,
      req.params.chunkIndex
    );

    res.json({
      uploadId: req.params.uploadId,
      chunk: result.chunk,
      text: result.text
    });
  } catch (error) {
    res.status(404).json({
      message: error.message || "Could not load chunk."
    });
  }
});

router.post("/generate-topic", requireAuth, async (req, res) => {
  try {
    const { subjectName, topicName, lectureText } = req.body;

    const topic = await generateTopicFromLecture({
      subjectName,
      topicName,
      lectureText
    });

    res.json({ topic });
  } catch (error) {
    console.error("AI generation failed:", error);
    res.status(400).json({
      message: error.message || "AI generation failed."
    });
  }
});

module.exports = router;
