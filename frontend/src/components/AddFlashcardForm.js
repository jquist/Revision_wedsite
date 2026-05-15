import React, { useState } from "react";

function AddFlashcardForm({ onAddFlashcard }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    onAddFlashcard({
      question: question.trim(),
      answer: answer.trim(),
      difficulty,
      tags: [],
    });
    setQuestion("");
    setAnswer("");
    setDifficulty("medium");
  }

  return (
    <form className="card revision-card shadow-sm mb-3" onSubmit={handleSubmit}>
      <div className="card-body">
        <h3 className="h5">Add flashcard</h3>
        <div className="mb-3">
          <label className="form-label" htmlFor="new-card-question">Question / front</label>
          <textarea
            id="new-card-question"
            className="form-control"
            rows="2"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="new-card-answer">Answer / back</label>
          <textarea
            id="new-card-answer"
            className="form-control"
            rows="2"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="new-card-difficulty">Difficulty</label>
          <select
            id="new-card-difficulty"
            className="form-select"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
        <button className="btn btn-success" type="submit">
          Save Card
        </button>
      </div>
    </form>
  );
}

export default AddFlashcardForm;
