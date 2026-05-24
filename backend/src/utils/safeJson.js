function stripCodeFences(value) {
  return String(value || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonObject(value) {
  const text = stripCodeFences(value);

  try {
    return JSON.parse(text);
  } catch (firstError) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw firstError;
    }

    const possibleJson = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(possibleJson);
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseGeneratedTopic(topic, fallbackName = "AI Generated Topic") {
  const safeTopic = topic || {};

  return {
    topicId:
      safeTopic.topicId ||
      String(safeTopic.topicName || fallbackName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${Date.now()}`,
    topicName: safeTopic.topicName || safeTopic.title || fallbackName,
    summary: safeTopic.summary || "",
    notes: ensureArray(safeTopic.notes),
    flashcards: ensureArray(safeTopic.flashcards).map((card, index) => ({
      flashcardId:
        card.flashcardId ||
        card.id ||
        `fc-${Date.now()}-${index}`,
      question: card.question || card.front || "",
      answer: card.answer || card.back || "",
      difficulty: card.difficulty || "medium",
      tags: ensureArray(card.tags),
      score: Number(card.score || 0),
      correctCount: Number(card.correctCount || 0),
      incorrectCount: Number(card.incorrectCount || 0),
      lastReviewed: card.lastReviewed || null
    })),
    quizQuestions: ensureArray(safeTopic.quizQuestions || safeTopic.quiz_questions).map(
      (question, index) => ({
        questionId:
          question.questionId ||
          question.id ||
          `q-${Date.now()}-${index}`,
        question: question.question || "",
        type: question.type || "multiple_choice",
        options: ensureArray(question.options),
        answer: question.answer || "",
        explanation: question.explanation || "",
        difficulty: question.difficulty || "medium",
        tags: ensureArray(question.tags)
      })
    ),
    glossary: ensureArray(safeTopic.glossary),
    sourceFiles: ensureArray(safeTopic.sourceFiles)
  };
}

module.exports = {
  extractJsonObject,
  normaliseGeneratedTopic
};
