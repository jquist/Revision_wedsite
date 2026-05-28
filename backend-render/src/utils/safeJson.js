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

function cleanString(value) {
  return String(value || "").trim();
}

function makeIdFromText(value, fallback) {
  const clean = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return clean || String(fallback || "item");
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

const QUESTION_TYPE_ALIASES = {
  multiple_choice: "single_choice",
  mcq: "single_choice",
  single: "single_choice",
  single_choice: "single_choice",
  multi_choice: "multi_select",
  multiple_multiple_choice: "multi_select",
  multiple_answer: "multi_select",
  multiple_answers: "multi_select",
  multi_select: "multi_select",
  select_multiple: "multi_select",
  written: "written",
  text: "written",
  text_response: "written",
  short_answer: "written",
  essay: "written",
  fill_blank: "fill_blank",
  fill_in_blank: "fill_blank",
  fill_in_the_blank: "fill_blank",
  cloze: "fill_blank",
  matching: "matching",
  match: "matching",
  match_pairs: "matching",
  ordering: "ordering",
  order: "ordering",
  sequence: "ordering",
  true_false: "true_false",
  truefalse: "true_false",
  boolean: "true_false"
};

function normaliseQuestionType(type) {
  const key = cleanString(type || "single_choice")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return QUESTION_TYPE_ALIASES[key] || "single_choice";
}

function optionTextFromValue(option) {
  if (typeof option === "string") return cleanString(option);
  return cleanString(option?.text || option?.label || option?.answer || option?.value || "");
}

function normaliseOptions(options) {
  return ensureArray(options)
    .map(optionTextFromValue)
    .filter(Boolean);
}

function normaliseCorrectAnswers(question, options) {
  const fromCorrectAnswers = ensureArray(question.correctAnswers || question.correct_answers || question.answers);
  const fromAnswer = ensureArray(question.answer);
  const fromCorrectAnswer = ensureArray(question.correctAnswer || question.correct_answer);
  const explicit = ensureArray(question.options)
    .filter((option) => option && typeof option === "object" && (option.isCorrect || option.correct))
    .map(optionTextFromValue);

  const answers = [
    ...fromCorrectAnswers,
    ...fromAnswer,
    ...fromCorrectAnswer,
    ...explicit
  ]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(cleanString)
    .filter(Boolean);

  return answers.length ? [...new Set(answers)] : [];
}

function normaliseBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = cleanString(value).toLowerCase();
  return ["true", "t", "yes", "y", "1", "correct"].includes(text);
}

function normaliseMatchItem(item, prefix, index) {
  if (typeof item === "string") {
    return {
      id: `${prefix}${index + 1}`,
      text: item
    };
  }

  return {
    id: cleanString(item?.id || item?.itemId || item?.key || item?.label || `${prefix}${index + 1}`),
    text: cleanString(item?.text || item?.term || item?.definition || item?.label || item?.value || item?.answer || "")
  };
}

function normaliseOrderingItems(items) {
  return ensureArray(items).map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `item${index + 1}`,
        text: item
      };
    }

    return {
      id: cleanString(item?.id || item?.itemId || item?.key || `item${index + 1}`),
      text: cleanString(item?.text || item?.label || item?.value || "")
    };
  }).filter((item) => item.text);
}

function normaliseQuizQuestion(question, index) {
  const type = normaliseQuestionType(question.type || question.questionType);
  const questionId = question.questionId || question.quizQuestionId || question.id || `q-${Date.now()}-${index}`;
  const base = {
    questionId,
    question: question.question || question.prompt || "",
    type,
    explanation: question.explanation || question.feedback || "",
    difficulty: question.difficulty || "medium",
    tags: ensureArray(question.tags),
    maxMarks: Number(question.maxMarks || question.marks || (type === "written" ? 5 : 1)) || (type === "written" ? 5 : 1)
  };

  if (type === "single_choice") {
    const options = normaliseOptions(question.options);
    return {
      ...base,
      options,
      answer: question.answer || question.correctAnswer || question.correct_answer || "",
      correctAnswer: question.correctAnswer || question.answer || question.correct_answer || ""
    };
  }

  if (type === "multi_select") {
    const options = normaliseOptions(question.options);
    return {
      ...base,
      options,
      correctAnswers: normaliseCorrectAnswers(question, options),
      minCorrect: Number(question.minCorrect || question.minimumCorrect || 0) || 0
    };
  }

  if (type === "written") {
    return {
      ...base,
      expectedAnswer: question.expectedAnswer || question.modelAnswer || question.answer || question.correctAnswer || "",
      markingPoints: ensureArray(question.markingPoints || question.mark_scheme || question.markScheme || question.rubric)
        .map(cleanString)
        .filter(Boolean),
      maxMarks: Number(question.maxMarks || question.marks || 5) || 5
    };
  }

  if (type === "fill_blank") {
    return {
      ...base,
      correctAnswers: ensureArray(question.correctAnswers || question.answers || question.answer || question.correctAnswer)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .map(cleanString)
        .filter(Boolean),
      caseSensitive: Boolean(question.caseSensitive)
    };
  }

  if (type === "matching") {
    const leftItems = ensureArray(question.leftItems || question.left || question.terms)
      .map((item, itemIndex) => normaliseMatchItem(item, String(itemIndex + 1), itemIndex))
      .filter((item) => item.text);
    const rightItems = ensureArray(question.rightItems || question.right || question.definitions)
      .map((item, itemIndex) => normaliseMatchItem(item, String.fromCharCode(65 + itemIndex), itemIndex))
      .filter((item) => item.text);

    return {
      ...base,
      leftItems,
      rightItems,
      correctMatches: question.correctMatches || question.matches || question.answer || {}
    };
  }

  if (type === "ordering") {
    const items = normaliseOrderingItems(question.items || question.options || question.steps);
    return {
      ...base,
      items,
      correctOrder: ensureArray(question.correctOrder || question.answer || question.correctAnswers)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .map(cleanString)
        .filter(Boolean)
    };
  }

  if (type === "true_false") {
    return {
      ...base,
      correctAnswer: normaliseBoolean(question.correctAnswer ?? question.answer ?? question.correct_answer)
    };
  }

  return base;
}

function isUsableQuestion(question) {
  if (!question.question) return false;

  if (question.type === "single_choice") return question.options.length >= 2 && Boolean(question.answer || question.correctAnswer);
  if (question.type === "multi_select") return question.options.length >= 2 && question.correctAnswers.length >= 1;
  if (question.type === "written") return Boolean(question.expectedAnswer || question.markingPoints.length);
  if (question.type === "fill_blank") return question.correctAnswers.length >= 1;
  if (question.type === "matching") return question.leftItems.length >= 2 && question.rightItems.length >= 2;
  if (question.type === "ordering") return question.items.length >= 2 && question.correctOrder.length >= 2;
  if (question.type === "true_false") return typeof question.correctAnswer === "boolean";

  return true;
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
    ).map(normaliseQuizQuestion).filter(isUsableQuestion),
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
