const { jsonrepair } = require("jsonrepair");

function stripCodeFences(value) {
  return String(value || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function findJsonObjectText(value) {
  const text = stripCodeFences(value);
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text;
  }

  return text.slice(firstBrace, lastBrace + 1);
}

function extractJsonObject(value) {
  const cleaned = stripCodeFences(value);
  const objectText = findJsonObjectText(cleaned);
  const attempts = [cleaned, objectText].filter(Boolean);
  const errors = [];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      errors.push(error.message);
    }

    try {
      const repaired = jsonrepair(attempt);
      return JSON.parse(repaired);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const preview = objectText.slice(0, 700).replace(/\s+/g, " ");
  throw new Error(
    `[JSON_001_PARSE_AND_REPAIR_FAILED] Could not parse or repair AI JSON. Errors: ${errors.join(" | ")}. Preview: ${preview}`
  );
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseNote(note, index) {
  if (typeof note === "string") {
    return {
      heading: `Note ${index + 1}`,
      content: note
    };
  }

  if (note && typeof note === "object") {
    return {
      heading: note.heading || note.title || `Note ${index + 1}`,
      content: note.content || note.text || note.summary || ""
    };
  }

  return {
    heading: `Note ${index + 1}`,
    content: String(note || "")
  };
}

function normaliseGeneratedTopic(topic, fallbackName = "AI Generated Topic") {
  const safeTopic = topic || {};
  const safeName = safeTopic.topicName || safeTopic.title || fallbackName;

  return {
    topicId:
      safeTopic.topicId ||
      String(safeName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${Date.now()}`,
    topicName: safeName,
    summary: safeTopic.summary || "",
    notes: ensureArray(safeTopic.notes).map(normaliseNote),
    flashcards: ensureArray(safeTopic.flashcards).map((card, index) => ({
      flashcardId: card.flashcardId || card.id || `fc-${Date.now()}-${index}`,
      question: card.question || card.front || "",
      answer: card.answer || card.back || "",
      difficulty: card.difficulty || "medium",
      tags: ensureArray(card.tags),
      score: Number(card.score || 0),
      correctCount: Number(card.correctCount || 0),
      incorrectCount: Number(card.incorrectCount || 0),
      lastReviewed: card.lastReviewed || null
    })).filter((card) => card.question && card.answer),
    quizQuestions: ensureArray(
      safeTopic.quizQuestions || safeTopic.quiz_questions
    ).map((question, index) => ({
      questionId: question.questionId || question.id || `q-${Date.now()}-${index}`,
      question: question.question || "",
      type: question.type || "multiple_choice",
      options: ensureArray(question.options).map((option) => {
        if (typeof option === "string") return option;
        return option?.text || option?.label || option?.value || "";
      }).filter(Boolean),
      answer: question.answer || question.correctAnswer || "",
      explanation: question.explanation || "",
      difficulty: question.difficulty || "medium",
      tags: ensureArray(question.tags)
    })).filter((question) => question.question && question.options.length >= 2),
    glossary: ensureArray(safeTopic.glossary).map((item) => {
      if (typeof item === "string") {
        return {
          term: item,
          definition: ""
        };
      }

      return {
        term: item?.term || item?.word || "",
        definition: item?.definition || item?.meaning || ""
      };
    }).filter((item) => item.term),
    sourceFiles: ensureArray(safeTopic.sourceFiles)
  };
}

module.exports = {
  extractJsonObject,
  normaliseGeneratedTopic
};
