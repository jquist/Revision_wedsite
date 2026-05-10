const express = require("express");
const requireAuth = require("../authMiddleware");
const { generateTopicFromLecture } = require("../ai/generateTopic");

const router = express.Router();

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
