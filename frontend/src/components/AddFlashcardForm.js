import React, { useState } from "react";

function AddFlashcardForm({ onAddFlashcard }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!question.trim() || !answer.trim()) {
      return;
    }

    onAddFlashcard({
      question: question.trim(),
      answer: answer.trim(),
    });

    setQuestion("");
    setAnswer("");
  }

  return (
    <form className="card shadow-sm mb-3" onSubmit={handleSubmit}>
      <div className="card-body">
        <h3 className="h4">Add Flashcard</h3>

        <div className="mb-3">
          <label className="form-label">Question</label>
          <input
            className="form-control"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: What does DNS stand for?"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Answer</label>
          <textarea
            className="form-control"
            rows="3"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Example: Domain Name System."
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Add Flashcard
        </button>
      </div>
    </form>
  );
}

export default AddFlashcardForm;
