import React, { useEffect, useMemo, useState } from "react";

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

function normaliseQuestion(question, index) {
  const questionId = question.questionId || question.id || `question-${index + 1}`;
  const options = (question.options || []).map((option, optionIndex) => {
    if (typeof option === "string") {
      return {
        optionId: stableOptionId(questionId, option, optionIndex),
        text: option,
      };
    }

    const text = String(option?.text || option?.label || option?.answer || "").trim();

    return {
      ...option,
      optionId:
        option?.optionId ||
        option?.id ||
        stableOptionId(questionId, text || `option-${optionIndex + 1}`, optionIndex),
      text,
    };
  });

  const oldCorrectText = question.correctAnswer || question.answer || "";
  let correctOptionId =
    question.correctOptionId || question.correct_option_id || question.correct_option || "";

  if (!correctOptionId && oldCorrectText) {
    const matchingOption = options.find((option) => option.text === oldCorrectText);
    correctOptionId = matchingOption?.optionId || "";
  }

  const correctOption = options.find((option) => option.optionId === correctOptionId);

  return {
    ...question,
    questionId,
    options: shuffleArray(options),
    correctOptionId,
    correctAnswerText: correctOption?.text || oldCorrectText,
  };
}

function PracticeTest({ topic }) {
  const questions = topic.quizQuestions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const preparedQuestions = useMemo(
    () => questions.map(normaliseQuestion),
    // Re-shuffle when the selected topic or its question list changes.
    // This stops the correct answer living in the same visual position every attempt.
    [topic.topicId, questions]
  );

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [topic.topicId, questions]);

  if (questions.length === 0) {
    return <p>No practice questions yet.</p>;
  }

  function handleAnswer(questionId, optionId) {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });
  }

  const score = preparedQuestions.filter(
    (question) => answers[question.questionId] === question.correctOptionId
  ).length;

  return (
    <div>
      <h2>Practice Test</h2>

      {preparedQuestions.map((question, index) => (
        <div className="card shadow-sm mb-3" key={question.questionId}>
          <div className="card-body">
            <h5>
              {index + 1}. {question.question}
              {question.topicName ? (
                <span className="badge text-bg-secondary ms-2">
                  {question.topicName}
                </span>
              ) : null}
            </h5>

            {question.options.map((option) => (
              <div className="form-check" key={option.optionId}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={question.questionId}
                  id={`${question.questionId}-${option.optionId}`}
                  checked={answers[question.questionId] === option.optionId}
                  onChange={() => handleAnswer(question.questionId, option.optionId)}
                />

                <label
                  className="form-check-label"
                  htmlFor={`${question.questionId}-${option.optionId}`}
                >
                  {option.text}
                </label>
              </div>
            ))}

            {submitted && (
              <div className="mt-2">
                {answers[question.questionId] === question.correctOptionId ? (
                  <span className="text-success">Correct</span>
                ) : (
                  <span className="text-danger">
                    Incorrect. Correct answer: {question.correctAnswerText}
                  </span>
                )}

                {question.explanation && (
                  <p className="small text-muted mt-2">{question.explanation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <button className="btn btn-primary" onClick={() => setSubmitted(true)}>
        Submit Test
      </button>

      {submitted && (
        <div className="alert alert-info mt-3">
          Score: {score} / {preparedQuestions.length}
        </div>
      )}
    </div>
  );
}

export default PracticeTest;
