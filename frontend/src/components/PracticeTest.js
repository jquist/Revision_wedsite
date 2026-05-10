import React, { useState } from "react";

function PracticeTest({ topic }) {
  const questions = topic.quizQuestions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return <p>No practice questions yet.</p>;
  }

  function handleAnswer(questionId, answer) {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  }

  const score = questions.filter(
    (question) => answers[question.questionId] === question.correctAnswer
  ).length;

  return (
    <div>
      <h2>Practice Test</h2>

      {questions.map((question, index) => (
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
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={question.questionId}
                  id={`${question.questionId}-${option}`}
                  checked={answers[question.questionId] === option}
                  onChange={() => handleAnswer(question.questionId, option)}
                />

                <label
                  className="form-check-label"
                  htmlFor={`${question.questionId}-${option}`}
                >
                  {option}
                </label>
              </div>
            ))}

            {submitted && (
              <div className="mt-2">
                {answers[question.questionId] === question.correctAnswer ? (
                  <span className="text-success">Correct</span>
                ) : (
                  <span className="text-danger">
                    Incorrect. Correct answer: {question.correctAnswer}
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
          Score: {score} / {questions.length}
        </div>
      )}
    </div>
  );
}

export default PracticeTest;
