const topicSchema = require("./topicSchema");

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Gemini returned text that could not be parsed as JSON.");
  }
}

function normaliseGeneratedTopic(topic, fallbackTopicName) {
  const topicName = topic.topicName || fallbackTopicName || "Generated Topic";
  const topicId = makeSlug(topic.topicId || topicName) || `topic-${Date.now()}`;

  const notes = ensureArray(topic.notes).slice(0, 8).map((note, index) => ({
    noteId: note.noteId || `n${index + 1}`,
    heading: note.heading || `Note ${index + 1}`,
    content: note.content || ""
  }));

  const flashcards = ensureArray(topic.flashcards).slice(0, 16).map((card, index) => ({
    flashcardId: card.flashcardId || `fc${index + 1}`,
    question: card.question || "",
    answer: card.answer || "",
    difficulty: ["easy", "medium", "hard"].includes(card.difficulty)
      ? card.difficulty
      : "medium",
    tags: ensureArray(card.tags),
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null
  }));

  const quizQuestions = ensureArray(topic.quizQuestions).slice(0, 10).map((question, index) => {
    const options = ensureArray(question.options).slice(0, 4);

    return {
      questionId: question.questionId || `q${index + 1}`,
      type: "multiple-choice",
      question: question.question || "",
      options,
      correctAnswer: question.correctAnswer || options[0] || "",
      explanation: question.explanation || ""
    };
  });

  const glossary = ensureArray(topic.glossary).slice(0, 12).map((item) => ({
    term: item.term || "",
    definition: item.definition || ""
  }));

  return {
    topicId,
    topicName,
    sourceFiles: ensureArray(topic.sourceFiles),
    summary: topic.summary || "",
    notes,
    flashcards,
    quizQuestions,
    glossary
  };
}

async function callGemini({ subjectName, topicName, lectureText }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
Create revision material from the lecture text.

Rules:
- Only use the lecture text provided.
- Do not invent specific facts not present in the lecture text.
- Use clear student-friendly wording.
- Return a topic object matching the requested JSON shape.
- Create 3 to 8 notes.
- Create 5 to 16 flashcards.
- Create 3 to 10 multiple-choice questions.
- Each multiple-choice question must have exactly 4 options.
- correctAnswer must exactly match one of the options.
- Create 3 to 12 glossary terms.
- Set every flashcard score to 0.
- Set every correctCount to 0.
- Set every incorrectCount to 0.
- Set every lastReviewed to null.
- Use type "multiple-choice" for every quiz question.

Subject: ${subjectName || "Unknown subject"}
Topic name: ${topicName || "Generated Topic"}

Lecture text:
${lectureText}
`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: topicSchema
      }
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Gemini request failed with status ${response.status}.`;

    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  if (!text) {
    throw new Error("Gemini did not return any content.");
  }

  return safeJsonParse(text);
}

async function generateTopicFromLecture({ subjectName, topicName, lectureText }) {
  if (!lectureText || lectureText.trim().length < 50) {
    throw new Error("Please provide more lecture text before generating.");
  }

  const parsedTopic = await callGemini({
    subjectName,
    topicName,
    lectureText
  });

  return normaliseGeneratedTopic(parsedTopic, topicName);
}

module.exports = {
  generateTopicFromLecture
};
