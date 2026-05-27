import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_LONG_TEST_SIZE = 25;
const DEFAULT_PAGE_SIZE = 10;

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

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
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

function optionTextFromValue(option) {
  if (typeof option === "string") return option;
  return String(option?.text || option?.label || option?.answer || option?.value || "").trim();
}

function normaliseQuestion(question, index) {
  const questionId = question.questionId || question.quizQuestionId || question.id || `question-${index + 1}`;
  const rawOptions = Array.isArray(question.options) ? question.options : [];

  const options = rawOptions.map((option, optionIndex) => {
    const text = optionTextFromValue(option);
    const originalLetter = String.fromCharCode(65 + optionIndex);

    return {
      ...(typeof option === "object" && option !== null ? option : {}),
      optionId: option?.optionId || option?.id || stableOptionId(questionId, text || `option-${optionIndex + 1}`, optionIndex),
      text,
      originalIndex: optionIndex,
      originalLetter,
      isCorrect: Boolean(option?.isCorrect || option?.correct),
    };
  });

  const answerValue = String(
    question.correctAnswer ||
      question.answer ||
      question.correct_answer ||
      question.correctOption ||
      ""
  ).trim();

  let correctOptionId = question.correctOptionId || question.correct_option_id || question.correct_option || "";

  if (!correctOptionId) {
    const explicitlyCorrect = options.find((option) => option.isCorrect);
    if (explicitlyCorrect) correctOptionId = explicitlyCorrect.optionId;
  }

  if (!correctOptionId && answerValue) {
    const exactTextMatch = options.find((option) => option.text === answerValue);
    if (exactTextMatch) correctOptionId = exactTextMatch.optionId;
  }

  if (!correctOptionId && answerValue) {
    const caseInsensitiveMatch = options.find(
      (option) => option.text.toLowerCase() === answerValue.toLowerCase()
    );
    if (caseInsensitiveMatch) correctOptionId = caseInsensitiveMatch.optionId;
  }

  // Supports old data where answer is "A", "B", "C", etc.
  if (!correctOptionId && /^[A-Z]$/i.test(answerValue)) {
    const letterIndex = answerValue.toUpperCase().charCodeAt(0) - 65;
    correctOptionId = options[letterIndex]?.optionId || "";
  }

  const correctOption = options.find((option) => option.optionId === correctOptionId);

  return {
    ...question,
    questionId,
    options: shuffleArray(options),
    correctOptionId,
    correctAnswerText: correctOption?.text || answerValue,
  };
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
    { value: "all", label: `All ${totalQuestions} questions` },
  ];
}

function makePageSizeOptions(selectedQuestionCount) {
  const sizeOptions = [5, 10, 20]
    .filter((size) => selectedQuestionCount > size)
    .map((size) => ({ value: String(size), label: `${size} per page` }));

  return [
    ...sizeOptions,
    { value: "all", label: "Show all" },
  ];
}

function scrollToTestAnchor(anchorId) {
  const anchor = document.getElementById(anchorId);
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
  const answeredCount = selectedQuestions.filter((question) => Boolean(answers[question.questionId])).length;
  const score = selectedQuestions.filter(
    (question) => answers[question.questionId] === question.correctOptionId
  ).length;
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

  function handleAnswer(questionId, optionId) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: optionId,
    }));
  }

  function handleTestSizeChange(nextSize) {
    setTestSize(nextSize);
    setAnswers({});
    setSubmitted(false);
    setCurrentPage(1);
    setQuestionSetSeed(Date.now());
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  }

  function handleNewQuestionSet() {
    setAnswers({});
    setSubmitted(false);
    setCurrentPage(1);
    setQuestionSetSeed(Date.now());
    scrollToTestAnchor("practice-test-top");
  }

  function goToPage(nextPage) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
    scrollToTestAnchor("practice-test-top");
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

  return (
    <div className="practice-test-wrap" id="practice-test-top">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">Practice Test</h2>
          <p className="text-muted mb-0">
            Pick one answer for each question. The answer order is shuffled, but the correct answer is tracked safely.
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
      </div>

      <div className="practice-test-status mb-3">
        Showing questions {startIndex + 1}–{endIndex} of {selectedQuestionCount}
        {isLimitedTest ? `, selected from ${totalQuestionCount} total.` : "."}
      </div>

      {renderPagination("top")}

      {pagedQuestions.map((question, index) => {
        const displayNumber = startIndex + index + 1;
        const selectedAnswer = answers[question.questionId];
        const isCorrect = selectedAnswer === question.correctOptionId;

        return (
          <div className="card shadow-sm mb-3" key={question.questionId}>
            <div className="card-body">
              <h5>
                {displayNumber}. {question.question}
                {question.topicName ? <span className="badge text-bg-secondary ms-2">{question.topicName}</span> : null}
              </h5>

              {question.options.map((option) => (
                <div className="form-check" key={option.optionId}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question-${question.questionId}`}
                    id={`${question.questionId}-${option.optionId}`}
                    checked={selectedAnswer === option.optionId}
                    onChange={() => handleAnswer(question.questionId, option.optionId)}
                  />
                  <label className="form-check-label" htmlFor={`${question.questionId}-${option.optionId}`}>
                    {option.text}
                  </label>
                </div>
              ))}

              {submitted && (
                <div className="mt-2">
                  {!selectedAnswer ? (
                    <span className="text-warning fw-semibold">
                      Not answered. Correct answer: {question.correctAnswerText || "not set"}
                    </span>
                  ) : isCorrect ? (
                    <span className="text-success fw-semibold">Correct</span>
                  ) : (
                    <span className="text-danger fw-semibold">
                      Incorrect. Correct answer: {question.correctAnswerText || "not set"}
                    </span>
                  )}
                  {question.explanation && <p className="small text-muted mt-2">{question.explanation}</p>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {renderPagination("bottom")}

      <div className="practice-submit-row" id="practice-test-bottom">
        <button className="btn btn-primary" onClick={() => setSubmitted(true)}>
          Submit Test
        </button>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
            setCurrentPage(1);
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
          Score: {score} / {selectedQuestionCount}
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
