const OpenAI = require("openai");
const topicSchema = require("./topicSchema");

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normaliseGeneratedTopic(topic, fallbackTopicName) {
  const topicName = topic.topicName || fallbackTopicName || "Generated Topic";
  const topicId = makeSlug(topic.topicId || topicName) || `topic-${Date.now()}`;

  return {
    ...topic,
    topicId,
    topicName,
    sourceFiles: Array.isArray(topic.sourceFiles) ? topic.sourceFiles : [],
    notes: (topic.notes || []).map((note, index) => ({
      noteId: note.noteId || `n${index + 1}`,
      heading: note.heading || `Note ${index + 1}`,
      content: note.content || ""
    })),
    flashcards: (topic.flashcards || []).map((card, index) => ({
      flashcardId: card.flashcardId || `fc${index + 1}`,
      question: card.question || "",
      answer: card.answer || "",
      difficulty: card.difficulty || "medium",
      tags: Array.isArray(card.tags) ? card.tags : [],
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: null
    })),
    quizQuestions: (topic.quizQuestions || []).map((question, index) => ({
      questionId: question.questionId || `q${index + 1}`,
      type: "multiple-choice",
      question: question.question || "",
      options: Array.isArray(question.options) ? question.options.slice(0, 4) : [],
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || ""
    })),
    glossary: Array.isArray(topic.glossary) ? topic.glossary : []
  };
}

async function generateTopicFromLecture({ subjectName, topicName, lectureText }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to backend/.env.");
  }

  if (!lectureText || lectureText.trim().length < 50) {
    throw new Error("Please provide more lecture text before generating.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You create accurate student revision material from lecture notes. Only use the provided lecture text. If something is not in the text, do not invent specific facts. Keep wording clear and suitable for undergraduate revision."
      },
      {
        role: "user",
        content: `Subject: ${subjectName || "Unknown subject"}\nTopic name: ${topicName || "Generated Topic"}\n\nLecture text:\n${lectureText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "revision_topic",
        strict: true,
        schema: topicSchema
      }
    }
  });

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("The AI did not return any content.");
  }

  const parsedTopic = JSON.parse(rawContent);

  return normaliseGeneratedTopic(parsedTopic, topicName);
}

module.exports = {
  generateTopicFromLecture
};
