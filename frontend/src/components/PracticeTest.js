import React, { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../config/env";

const DEFAULT_LONG_TEST_SIZE = 25;
const DEFAULT_PAGE_SIZE = 10;

const QUESTION_TYPE_LABELS = {
  single_choice: "Multiple choice",
  multi_select: "Select multiple",
  written: "Written answer",
  fill_blank: "Fill blank",
  matching: "Matching",
  ordering: "Ordering",
  true_false: "True / false"
};

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

function makeIdFromText(value, fallback) {
  const clean = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return clean || String(fallback);
}

function stableOptionId(questionId, optionText, index) {
  return `${questionId}-opt-${makeIdFromText(optionText, index + 1)}`;
}

function hashSeed(value) {
  let hash = 2166136261;
  const text = String(value || "seed");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seedValue) {
  let seed = hashSeed(seedValue) || 1;

  return function random() {
    seed += 0x6D2B79F5;
    let next = seed;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seedValue) {
  const shuffled = [...items];
  const random = seededRandom(seedValue);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function normaliseQuestionType(type) {
  const key = String(type || "single_choice")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return QUESTION_TYPE_ALIASES[key] || "single_choice";
}

function optionTextFromValue(option) {
  if (typeof option === "string") return option;
  return String(option?.text || option?.label || option?.answer || option?.value || "").trim();
}

function normaliseOptions(questionId, rawOptions) {
  return (Array.isArray(rawOptions) ? rawOptions : []).map((option, optionIndex) => {
    const text = optionTextFromValue(option);
    const originalLetter = String.fromCharCode(65 + optionIndex);

    return {
      ...(typeof option === "object" && option !== null ? option : {}),
      optionId: option?.optionId || option?.id || stableOptionId(questionId, text || `option-${optionIndex + 1}`, optionIndex),
      text,
      originalIndex: optionIndex,
      originalLetter,
      isCorrect: Boolean(option?.isCorrect || option?.correct)
    };
  }).filter((option) => option.text);
}

function getAnswerValues(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (value === true || value === false) return [String(value)];
  const text = String(value || "").trim();
  if (!text) return [];
  return text.includes("|")
    ? text.split("|").map((item) => item.trim()).filter(Boolean)
    : [text];
}

function resolveOptionIdsFromAnswers(options, answerValues) {
  const correctIds = new Set();

  answerValues.forEach((answerValue) => {
    const exactTextMatch = options.find((option) => option.text === answerValue);
    if (exactTextMatch) {
      correctIds.add(exactTextMatch.optionId);
      return;
    }

    const caseInsensitiveMatch = options.find(
      (option) => option.text.toLowerCase() === answerValue.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      correctIds.add(caseInsensitiveMatch.optionId);
      return;
    }

    if (/^[A-Z]$/i.test(answerValue)) {
      const letterIndex = answerValue.toUpperCase().charCodeAt(0) - 65;
      if (options[letterIndex]) correctIds.add(options[letterIndex].optionId);
    }
  });

  options.forEach((option) => {
    if (option.isCorrect) correctIds.add(option.optionId);
  });

  return Array.from(correctIds);
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["true", "t", "yes", "y", "1", "correct"].includes(String(value || "").trim().toLowerCase());
}

function normaliseMatchItem(item, fallbackId) {
  if (typeof item === "string") {
    return {
      id: fallbackId,
      text: item
    };
  }

  return {
    id: String(item?.id || item?.itemId || item?.key || item?.label || fallbackId),
    text: String(item?.text || item?.term || item?.definition || item?.label || item?.value || item?.answer || "").trim()
  };
}

function normaliseOrderingItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `item-${index + 1}`,
      text: item
    };
  }

  return {
    id: String(item?.id || item?.itemId || item?.key || `item-${index + 1}`),
    text: String(item?.text || item?.label || item?.value || "").trim()
  };
}

function normaliseCorrectMatches(rawMatches, leftItems, rightItems) {
  const matches = rawMatches && typeof rawMatches === "object" ? rawMatches : {};
  const normalised = {};

  Object.entries(matches).forEach(([rawLeft, rawRight]) => {
    const leftMatch = leftItems.find((item) =>
      item.id === rawLeft || item.text === rawLeft || item.text.toLowerCase() === String(rawLeft).toLowerCase()
    );
    const rightMatch = rightItems.find((item) =>
      item.id === rawRight || item.text === rawRight || item.text.toLowerCase() === String(rawRight).toLowerCase()
    );

    if (leftMatch && rightMatch) {
      normalised[leftMatch.id] = rightMatch.id;
    }
  });

  return normalised;
}

function normaliseCorrectOrder(rawOrder, items) {
  const orderValues = Array.isArray(rawOrder) ? rawOrder.map((item) => String(item || "").trim()).filter(Boolean) : [];

  if (!orderValues.length) return items.map((item) => item.id);

  return orderValues.map((value) => {
    const match = items.find((item) =>
      item.id === value || item.text === value || item.text.toLowerCase() === value.toLowerCase()
    );
    return match?.id || value;
  });
}

function normaliseQuestion(question, index) {
  const questionId = question.questionId || question.quizQuestionId || question.id || `question-${index + 1}`;
  const type = normaliseQuestionType(question.type || question.questionType);
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const base = {
    ...question,
    questionId,
    type,
    maxMarks: Number(question.maxMarks || question.marks || (type === "written" ? 5 : 1)) || (type === "written" ? 5 : 1)
  };

  if (type === "single_choice") {
    const options = normaliseOptions(questionId, rawOptions);
    const answerValue = String(
      question.correctAnswer || question.answer || question.correct_answer || question.correctOption || ""
    ).trim();
    const correctOptionIds = resolveOptionIdsFromAnswers(options, [answerValue]);
    const correctOptionId = question.correctOptionId || question.correct_option_id || question.correct_option || correctOptionIds[0] || "";
    const correctOption = options.find((option) => option.optionId === correctOptionId);

    return {
      ...base,
      options: seededShuffle(options, `${questionId}-options`),
      correctOptionId,
      correctAnswerText: correctOption?.text || answerValue
    };
  }

  if (type === "multi_select") {
    const options = normaliseOptions(questionId, rawOptions);
    const answerValues = [
      ...getAnswerValues(question.correctAnswers || question.correct_answers || question.answers),
      ...getAnswerValues(question.answer || question.correctAnswer || question.correct_answer)
    ];
    const correctOptionIds = resolveOptionIdsFromAnswers(options, answerValues);

    return {
      ...base,
      options: seededShuffle(options, `${questionId}-options`),
      correctOptionIds,
      correctAnswerText: options
        .filter((option) => correctOptionIds.includes(option.optionId))
        .map((option) => option.text)
        .join(", ")
    };
  }

  if (type === "written") {
    return {
      ...base,
      expectedAnswer: question.expectedAnswer || question.modelAnswer || question.answer || question.correctAnswer || "",
      markingPoints: Array.isArray(question.markingPoints || question.markScheme || question.mark_scheme)
        ? (question.markingPoints || question.markScheme || question.mark_scheme).map(String).filter(Boolean)
        : []
    };
  }

  if (type === "fill_blank") {
    return {
      ...base,
      correctAnswers: getAnswerValues(question.correctAnswers || question.answers || question.answer || question.correctAnswer),
      caseSensitive: Boolean(question.caseSensitive)
    };
  }

  if (type === "matching") {
    const leftItems = (Array.isArray(question.leftItems || question.left || question.terms) ? (question.leftItems || question.left || question.terms) : [])
      .map((item, itemIndex) => normaliseMatchItem(item, String(itemIndex + 1)))
      .filter((item) => item.text);
    const rightItems = (Array.isArray(question.rightItems || question.right || question.definitions) ? (question.rightItems || question.right || question.definitions) : [])
      .map((item, itemIndex) => normaliseMatchItem(item, String.fromCharCode(65 + itemIndex)))
      .filter((item) => item.text);

    return {
      ...base,
      leftItems,
      rightItems: seededShuffle(rightItems, `${questionId}-right-items`),
      correctMatches: normaliseCorrectMatches(question.correctMatches || question.matches || question.answer, leftItems, rightItems),
      maxMarks: Number(question.maxMarks || question.marks || leftItems.length || 1) || 1
    };
  }

  if (type === "ordering") {
    const items = (Array.isArray(question.items || question.steps || question.options) ? (question.items || question.steps || question.options) : [])
      .map(normaliseOrderingItem)
      .filter((item) => item.text);

    return {
      ...base,
      items: seededShuffle(items, `${questionId}-order-items`),
      correctOrder: normaliseCorrectOrder(question.correctOrder || question.correctAnswers || question.answer, items),
      maxMarks: Number(question.maxMarks || question.marks || 1) || 1
    };
  }

  if (type === "true_false") {
    return {
      ...base,
      correctAnswer: toBoolean(question.correctAnswer ?? question.answer ?? question.correct_answer)
    };
  }

  return base;
}

function getDefaultTestSize(totalQuestions) {
  return totalQuestions > DEFAULT_LONG_TEST_SIZE ? String(DEFAULT_LONG_TEST_SIZE) : "all";
}

function makeTestSizeOptions(totalQuestions) {
  const sizeOptions = [10, 25, 50]
    .filter((size) => totalQuestions > size)
    .map((size) => ({ value: String(size), label: `${size} questions` }));

  return [
    ...sizeOptions,
    { value: "all", label: `All ${totalQuestions} questions` }
  ];
}

function makePageSizeOptions(selectedQuestionCount) {
  const sizeOptions = [5, 10, 20]
    .filter((size) => selectedQuestionCount > size)
    .map((size) => ({ value: String(size), label: `${size} per page` }));

  return [
    ...sizeOptions,
    { value: "all", label: "Show all" }
  ];
}

function scrollToTestAnchor(anchorId) {
  const anchor = document.getElementById(anchorId);
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function normaliseText(value, caseSensitive = false) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return caseSensitive ? text : text.toLowerCase();
}

function arraysEqualAsSet(a, b) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((item) => setA.has(item));
}

function isQuestionAnswered(question, answer) {
  if (question.type === "multi_select") return Array.isArray(answer) && answer.length > 0;
  if (question.type === "matching") return Boolean(answer) && question.leftItems.every((item) => Boolean(answer[item.id]));
  if (question.type === "ordering") return Boolean(answer) && question.items.every((item) => Boolean(answer[item.id]));
  if (question.type === "written" || question.type === "fill_blank") return Boolean(String(answer || "").trim());
  return answer !== undefined && answer !== null && answer !== "";
}

function getQuestionMaxMarks(question) {
  return Math.max(1, Number(question.maxMarks || (question.type === "written" ? 5 : 1)) || 1);
}

function getMatchingCorrectCount(question, answer = {}) {
  return question.leftItems.filter((item) => answer[item.id] === question.correctMatches[item.id]).length;
}

function getOrderingAnswerOrder(question, answer = {}) {
  return [...question.items]
    .filter((item) => answer[item.id])
    .sort((a, b) => Number(answer[a.id]) - Number(answer[b.id]))
    .map((item) => item.id);
}

function isObjectiveAnswerCorrect(question, answer) {
  if (!isQuestionAnswered(question, answer)) return false;

  if (question.type === "single_choice") return answer === question.correctOptionId;
  if (question.type === "multi_select") return arraysEqualAsSet(answer || [], question.correctOptionIds || []);
  if (question.type === "fill_blank") {
    const userAnswer = normaliseText(answer, question.caseSensitive);
    return (question.correctAnswers || []).some((correctAnswer) => normaliseText(correctAnswer, question.caseSensitive) === userAnswer);
  }
  if (question.type === "matching") return getMatchingCorrectCount(question, answer) === question.leftItems.length;
  if (question.type === "ordering") return arraysEqualAsSet(getOrderingAnswerOrder(question, answer), question.correctOrder || [])
    && getOrderingAnswerOrder(question, answer).every((itemId, index) => itemId === question.correctOrder[index]);
  if (question.type === "true_false") return answer === String(question.correctAnswer);

  return false;
}

function getAwardedMarks(question, answer, aiMark) {
  const maxMarks = getQuestionMaxMarks(question);

  if (question.type === "written") {
    return Number(aiMark?.marksAwarded || 0);
  }

  if (!isQuestionAnswered(question, answer)) return 0;

  if (question.type === "matching") {
    const total = Math.max(1, question.leftItems.length);
    return (getMatchingCorrectCount(question, answer) / total) * maxMarks;
  }

  return isObjectiveAnswerCorrect(question, answer) ? maxMarks : 0;
}

function formatMarks(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, "");
}

async function markWrittenAnswer(question, userAnswer) {
  const response = await fetch(`${getApiBaseUrl()}/api/ai/mark-written-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question: question.question,
      expectedAnswer: question.expectedAnswer,
      markingPoints: question.markingPoints,
      maxMarks: getQuestionMaxMarks(question),
      userAnswer
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `AI marking failed with status ${response.status}.`);
  }

  return payload.result;
}

function PracticeTest({ topic }) {
  const questions = useMemo(
    () => topic.quizQuestions || topic.quiz_questions || [],
    [topic.quizQuestions, topic.quiz_questions]
  );
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [testSize, setTestSize] = useState(() => getDefaultTestSize(questions.length));
  const [pageSize, setPageSize] = useState(String(DEFAULT_PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(1);
  const [questionSetSeed, setQuestionSetSeed] = useState(() => Date.now());
  const [aiMarks, setAiMarks] = useState({});
  const [aiMarkStatus, setAiMarkStatus] = useState({});
  const [aiMarkErrors, setAiMarkErrors] = useState({});

  const preparedQuestions = useMemo(
    () => questions.map(normaliseQuestion),
    [questions]
  );

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setCurrentPage(1);
    setTestSize(getDefaultTestSize(questions.length));
    setPageSize(String(DEFAULT_PAGE_SIZE));
    setQuestionSetSeed(Date.now());
    setAiMarks({});
    setAiMarkStatus({});
    setAiMarkErrors({});
  }, [topic.topicId, questions.length]);

  const totalQuestionCount = preparedQuestions.length;
  const safeTestSize = useMemo(() => {
    if (testSize === "all") return "all";

    const numericSize = Number(testSize);
    if (!Number.isFinite(numericSize) || numericSize <= 0 || numericSize >= totalQuestionCount) {
      return "all";
    }

    return numericSize;
  }, [testSize, totalQuestionCount]);

  const selectedQuestions = useMemo(() => {
    if (safeTestSize === "all") return preparedQuestions;

    return seededShuffle(
      preparedQuestions,
      `${topic.topicId || "topic"}-${questionSetSeed}-${safeTestSize}`
    ).slice(0, safeTestSize);
  }, [preparedQuestions, questionSetSeed, safeTestSize, topic.topicId]);

  const selectedQuestionCount = selectedQuestions.length;
  const safePageSize = useMemo(() => {
    if (pageSize === "all") return selectedQuestionCount || 1;

    const numericPageSize = Number(pageSize);
    if (!Number.isFinite(numericPageSize) || numericPageSize <= 0) return DEFAULT_PAGE_SIZE;

    return Math.min(numericPageSize, selectedQuestionCount || numericPageSize);
  }, [pageSize, selectedQuestionCount]);

  const totalPages = Math.max(1, Math.ceil(selectedQuestionCount / safePageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, selectedQuestionCount);
  const pagedQuestions = selectedQuestions.slice(startIndex, endIndex);
  const answeredCount = selectedQuestions.filter((question) => isQuestionAnswered(question, answers[question.questionId])).length;
  const totalMarks = selectedQuestions.reduce((total, question) => total + getQuestionMaxMarks(question), 0);
  const score = selectedQuestions.reduce(
    (total, question) => total + getAwardedMarks(question, answers[question.questionId], aiMarks[question.questionId]),
    0
  );
  const writtenQuestionCount = selectedQuestions.filter((question) => question.type === "written").length;
  const isLongTest = totalQuestionCount > DEFAULT_LONG_TEST_SIZE;
  const isLimitedTest = safeTestSize !== "all" && selectedQuestionCount < totalQuestionCount;
  const testSizeOptions = makeTestSizeOptions(totalQuestionCount);
  const pageSizeOptions = makePageSizeOptions(selectedQuestionCount);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (questions.length === 0) {
    return <p>No practice questions yet.</p>;
  }

  function updateAnswer(questionId, value) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value
    }));
  }

  function handleMultiSelect(questionId, optionId, checked) {
    setAnswers((currentAnswers) => {
      const current = Array.isArray(currentAnswers[questionId]) ? currentAnswers[questionId] : [];
      const next = checked
        ? [...new Set([...current, optionId])]
        : current.filter((item) => item !== optionId);

      return {
        ...currentAnswers,
        [questionId]: next
      };
    });
  }

  function handleNestedAnswer(questionId, key, value) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: {
        ...(currentAnswers[questionId] || {}),
        [key]: value
      }
    }));
  }

  function resetTestAnswers() {
    setAnswers({});
    setSubmitted(false);
    setCurrentPage(1);
    setAiMarks({});
    setAiMarkStatus({});
    setAiMarkErrors({});
  }

  function handleTestSizeChange(nextSize) {
    setTestSize(nextSize);
    resetTestAnswers();
    setQuestionSetSeed(Date.now());
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  }

  function handleNewQuestionSet() {
    resetTestAnswers();
    setQuestionSetSeed(Date.now());
    scrollToTestAnchor("practice-test-top");
  }

  function goToPage(nextPage) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
    scrollToTestAnchor("practice-test-top");
  }

  async function handleSubmitTest() {
    setSubmitted(true);
    const writtenQuestionsToMark = selectedQuestions.filter((question) =>
      question.type === "written" &&
      isQuestionAnswered(question, answers[question.questionId]) &&
      !aiMarks[question.questionId]
    );

    writtenQuestionsToMark.forEach((question) => {
      setAiMarkStatus((current) => ({ ...current, [question.questionId]: "marking" }));
      setAiMarkErrors((current) => ({ ...current, [question.questionId]: "" }));
    });

    await Promise.all(writtenQuestionsToMark.map(async (question) => {
      try {
        const result = await markWrittenAnswer(question, answers[question.questionId]);
        setAiMarks((current) => ({ ...current, [question.questionId]: result }));
        setAiMarkStatus((current) => ({ ...current, [question.questionId]: "complete" }));
      } catch (error) {
        setAiMarkStatus((current) => ({ ...current, [question.questionId]: "error" }));
        setAiMarkErrors((current) => ({
          ...current,
          [question.questionId]: error?.message || "AI marking failed."
        }));
      }
    }));
  }

  function renderPagination(location = "bottom") {
    if (totalPages <= 1) return null;

    return (
      <div className={`practice-pagination practice-pagination-${location}`}>
        <button
          className="btn btn-outline-primary btn-sm"
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => goToPage(safeCurrentPage - 1)}
        >
          Previous
        </button>
        <span className="practice-page-count">
          Page {safeCurrentPage} of {totalPages}
        </span>
        <button
          className="btn btn-outline-primary btn-sm"
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => goToPage(safeCurrentPage + 1)}
        >
          Next
        </button>
      </div>
    );
  }

  function renderQuestionInput(question) {
    const selectedAnswer = answers[question.questionId];

    if (question.type === "single_choice") {
      return question.options.map((option) => (
        <div className="form-check" key={option.optionId}>
          <input
            className="form-check-input"
            type="radio"
            name={`question-${question.questionId}`}
            id={`${question.questionId}-${option.optionId}`}
            checked={selectedAnswer === option.optionId}
            onChange={() => updateAnswer(question.questionId, option.optionId)}
          />
          <label className="form-check-label" htmlFor={`${question.questionId}-${option.optionId}`}>
            {option.text}
          </label>
        </div>
      ));
    }

    if (question.type === "multi_select") {
      return (
        <div>
          <p className="small text-muted mb-2">Select all answers that apply.</p>
          {question.options.map((option) => (
            <div className="form-check" key={option.optionId}>
              <input
                className="form-check-input"
                type="checkbox"
                name={`question-${question.questionId}`}
                id={`${question.questionId}-${option.optionId}`}
                checked={Array.isArray(selectedAnswer) && selectedAnswer.includes(option.optionId)}
                onChange={(event) => handleMultiSelect(question.questionId, option.optionId, event.target.checked)}
              />
              <label className="form-check-label" htmlFor={`${question.questionId}-${option.optionId}`}>
                {option.text}
              </label>
            </div>
          ))}
        </div>
      );
    }

    if (question.type === "written") {
      return (
        <label className="field-block practice-written-field">
          <span>Your answer</span>
          <textarea
            rows={5}
            value={selectedAnswer || ""}
            placeholder="Type your answer here..."
            onChange={(event) => updateAnswer(question.questionId, event.target.value)}
          />
        </label>
      );
    }

    if (question.type === "fill_blank") {
      return (
        <label className="field-block practice-fill-field">
          <span>Answer</span>
          <input
            value={selectedAnswer || ""}
            placeholder="Type the missing word or phrase"
            onChange={(event) => updateAnswer(question.questionId, event.target.value)}
          />
        </label>
      );
    }

    if (question.type === "matching") {
      return (
        <div className="practice-matching-list">
          {question.leftItems.map((leftItem) => (
            <label className="practice-match-row" key={leftItem.id}>
              <span className="practice-match-left"><strong>{leftItem.id}.</strong> {leftItem.text}</span>
              <select
                value={selectedAnswer?.[leftItem.id] || ""}
                onChange={(event) => handleNestedAnswer(question.questionId, leftItem.id, event.target.value)}
              >
                <option value="">Choose match</option>
                {question.rightItems.map((rightItem) => (
                  <option key={rightItem.id} value={rightItem.id}>
                    {rightItem.id}. {rightItem.text}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      );
    }

    if (question.type === "ordering") {
      const usedPositions = new Set(Object.values(selectedAnswer || {}).map(String).filter(Boolean));

      return (
        <div className="practice-ordering-list">
          <p className="small text-muted mb-2">Give each item a unique position from 1 to {question.items.length}.</p>
          {question.items.map((item) => (
            <label className="practice-order-row" key={item.id}>
              <span>{item.text}</span>
              <select
                value={selectedAnswer?.[item.id] || ""}
                onChange={(event) => handleNestedAnswer(question.questionId, item.id, event.target.value)}
              >
                <option value="">Position</option>
                {question.items.map((_, positionIndex) => {
                  const position = String(positionIndex + 1);
                  const isUsedByOtherItem = usedPositions.has(position) && selectedAnswer?.[item.id] !== position;
                  return (
                    <option key={position} value={position} disabled={isUsedByOtherItem}>
                      {position}
                    </option>
                  );
                })}
              </select>
            </label>
          ))}
        </div>
      );
    }

    if (question.type === "true_false") {
      return ["true", "false"].map((value) => (
        <div className="form-check" key={value}>
          <input
            className="form-check-input"
            type="radio"
            name={`question-${question.questionId}`}
            id={`${question.questionId}-${value}`}
            checked={selectedAnswer === value}
            onChange={() => updateAnswer(question.questionId, value)}
          />
          <label className="form-check-label" htmlFor={`${question.questionId}-${value}`}>
            {value === "true" ? "True" : "False"}
          </label>
        </div>
      ));
    }

    return <p className="text-muted">Unsupported question type.</p>;
  }

  function renderFeedback(question) {
    if (!submitted) return null;

    const answer = answers[question.questionId];
    const maxMarks = getQuestionMaxMarks(question);
    const awardedMarks = getAwardedMarks(question, answer, aiMarks[question.questionId]);
    const isAnswered = isQuestionAnswered(question, answer);
    const isCorrect = question.type !== "written" && isObjectiveAnswerCorrect(question, answer);

    if (question.type === "written") {
      const markStatus = aiMarkStatus[question.questionId];
      const mark = aiMarks[question.questionId];
      const markError = aiMarkErrors[question.questionId];

      return (
        <div className="practice-feedback-box mt-3">
          {!isAnswered && <p className="text-warning fw-semibold mb-2">Not answered.</p>}
          {isAnswered && markStatus === "marking" && <p className="text-muted fw-semibold mb-2">AI marking this answer...</p>}
          {isAnswered && markStatus === "error" && (
            <p className="text-danger fw-semibold mb-2">AI marking failed: {markError}</p>
          )}
          {mark && (
            <div className="ai-mark-feedback">
              <p className="fw-bold mb-1">AI mark: {formatMarks(mark.marksAwarded)} / {formatMarks(mark.maxMarks)}</p>
              <p className="mb-2">{mark.feedback}</p>
              {mark.correctPoints?.length > 0 && (
                <div>
                  <strong>Got right:</strong>
                  <ul>{mark.correctPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
                </div>
              )}
              {mark.missingPoints?.length > 0 && (
                <div>
                  <strong>Missing / unclear:</strong>
                  <ul>{mark.missingPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
                </div>
              )}
              {mark.improvementTip && <p className="small text-muted mb-0">Tip: {mark.improvementTip}</p>}
            </div>
          )}
          {question.expectedAnswer && (
            <details className="mt-2">
              <summary>Show model answer</summary>
              <p className="small text-muted mt-2 mb-0">{question.expectedAnswer}</p>
            </details>
          )}
          {question.markingPoints?.length > 0 && (
            <details className="mt-2">
              <summary>Show marking points</summary>
              <ul className="small text-muted mt-2 mb-0">
                {question.markingPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            </details>
          )}
        </div>
      );
    }

    return (
      <div className="practice-feedback-box mt-3">
        {!isAnswered ? (
          <span className="text-warning fw-semibold">Not answered.</span>
        ) : isCorrect ? (
          <span className="text-success fw-semibold">Correct</span>
        ) : (
          <span className="text-danger fw-semibold">Incorrect</span>
        )}
        <span className="ms-2 small text-muted">
          Marks: {formatMarks(awardedMarks)} / {formatMarks(maxMarks)}
        </span>
        {question.type === "single_choice" && !isCorrect && (
          <p className="small text-muted mt-2 mb-0">Correct answer: {question.correctAnswerText || "not set"}</p>
        )}
        {question.type === "multi_select" && !isCorrect && (
          <p className="small text-muted mt-2 mb-0">Correct answers: {question.correctAnswerText || "not set"}</p>
        )}
        {question.type === "fill_blank" && !isCorrect && (
          <p className="small text-muted mt-2 mb-0">Accepted answer: {(question.correctAnswers || []).join(" / ")}</p>
        )}
        {question.type === "matching" && (
          <p className="small text-muted mt-2 mb-0">
            Correct matches: {question.leftItems.map((leftItem) => {
              const rightId = question.correctMatches[leftItem.id];
              const rightItem = question.rightItems.find((item) => item.id === rightId);
              return `${leftItem.id}→${rightItem?.id || rightId}`;
            }).join(", ")}
          </p>
        )}
        {question.type === "ordering" && !isCorrect && (
          <p className="small text-muted mt-2 mb-0">
            Correct order: {(question.correctOrder || []).map((itemId) => {
              const item = question.items.find((candidate) => candidate.id === itemId);
              return item?.text || itemId;
            }).join(" → ")}
          </p>
        )}
        {question.type === "true_false" && !isCorrect && (
          <p className="small text-muted mt-2 mb-0">Correct answer: {question.correctAnswer ? "True" : "False"}</p>
        )}
        {question.explanation && <p className="small text-muted mt-2 mb-0">{question.explanation}</p>}
      </div>
    );
  }

  return (
    <div className="practice-test-wrap" id="practice-test-top">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">Practice Test</h2>
          <p className="text-muted mb-0">
            Answer the generated mix of question types. Written answers can be AI-marked using your Render backend.
          </p>
        </div>
        <div className="practice-test-count-pill" aria-label="Practice test progress">
          {answeredCount} / {selectedQuestionCount} answered
        </div>
      </div>

      <div className="practice-control-card mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label" htmlFor="practice-test-size">Questions in this test</label>
            <select
              id="practice-test-size"
              className="form-select"
              value={testSize}
              onChange={(event) => handleTestSizeChange(event.target.value)}
            >
              {testSizeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label" htmlFor="practice-page-size">Page size</label>
            <select
              id="practice-page-size"
              className="form-select"
              value={pageSize}
              onChange={(event) => handlePageSizeChange(event.target.value)}
            >
              {pageSizeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <div className="d-flex flex-wrap gap-2">
              {isLimitedTest && (
                <button className="btn btn-outline-secondary" type="button" onClick={handleNewQuestionSet}>
                  New question set
                </button>
              )}
              <button className="btn btn-outline-secondary" type="button" onClick={() => scrollToTestAnchor("practice-test-bottom")}>
                Bottom
              </button>
            </div>
          </div>
        </div>

        {isLongTest && (
          <p className="small text-muted mb-0 mt-3">
            This topic has {totalQuestionCount} questions, so ForgeNotes starts with a manageable {DEFAULT_LONG_TEST_SIZE}-question test.
            {isLimitedTest ? " Use New question set for another mix, or choose All to revise everything." : " You are currently using the full test."}
          </p>
        )}

        {writtenQuestionCount > 0 && (
          <p className="small text-muted mb-0 mt-2">
            Written answers are sent to the Render backend for Gemini marking after you submit. AI marks are guidance, not perfect exam marking.
          </p>
        )}
      </div>

      <div className="practice-test-status mb-3">
        Showing questions {startIndex + 1}–{endIndex} of {selectedQuestionCount}
        {isLimitedTest ? `, selected from ${totalQuestionCount} total.` : "."}
      </div>

      {renderPagination("top")}

      {pagedQuestions.map((question, index) => {
        const displayNumber = startIndex + index + 1;

        return (
          <div className="card shadow-sm mb-3 practice-question-card" key={question.questionId}>
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <h5 className="mb-0">
                  {displayNumber}. {question.question}
                  {question.topicName ? <span className="badge text-bg-secondary ms-2">{question.topicName}</span> : null}
                </h5>
                <span className="question-type-badge">{QUESTION_TYPE_LABELS[question.type] || question.type}</span>
              </div>

              {renderQuestionInput(question)}
              {renderFeedback(question)}
            </div>
          </div>
        );
      })}

      {renderPagination("bottom")}

      <div className="practice-submit-row" id="practice-test-bottom">
        <button className="btn btn-primary" onClick={handleSubmitTest}>
          Submit Test
        </button>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => {
            resetTestAnswers();
            scrollToTestAnchor("practice-test-top");
          }}
        >
          Clear answers
        </button>
        <span className="small text-muted">
          Answered {answeredCount} / {selectedQuestionCount}
        </span>
      </div>

      {submitted && (
        <div className="alert alert-info mt-3">
          Score: {formatMarks(score)} / {formatMarks(totalMarks)} marks
          {answeredCount < selectedQuestionCount ? ` (${selectedQuestionCount - answeredCount} unanswered)` : ""}
        </div>
      )}

      <div className="practice-scroll-buttons" aria-label="Practice test quick navigation">
        <button type="button" onClick={() => scrollToTestAnchor("practice-test-top")}>Top</button>
        <button type="button" onClick={() => scrollToTestAnchor("practice-test-bottom")}>Bottom</button>
      </div>
    </div>
  );
}

export default PracticeTest;
