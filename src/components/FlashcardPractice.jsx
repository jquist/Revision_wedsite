import React, { useState } from "react";

function FlashcardPractice({ topic, onMarkFlashcard }) {
  const flashcards = topic.flashcards || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (flashcards.length === 0) {
    return <p>No flashcards yet.</p>;
  }

  const currentCard = flashcards[currentIndex];

  function goNext() {
    setShowAnswer(false);
    setCurrentIndex((previous) =>
      previous === flashcards.length - 1 ? 0 : previous + 1
    );
  }

  function markCard(wasCorrect) {
    onMarkFlashcard(topic.topicId, currentCard.flashcardId, wasCorrect);
    goNext();
  }

  return (
    <div>
      <h2>Flashcards</h2>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <p className="text-muted">
            Card {currentIndex + 1} of {flashcards.length}
          </p>

          <h4>{currentCard.question}</h4>

          {showAnswer && (
            <div className="alert alert-success mt-3">
              {currentCard.answer}
            </div>
          )}

          <div className="small text-muted mb-3">
            Correct: {currentCard.correctCount || 0} | Incorrect:{" "}
            {currentCard.incorrectCount || 0}
          </div>

          <button
            className="btn btn-primary me-2"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </button>

          <button className="btn btn-outline-secondary" onClick={goNext}>
            Skip
          </button>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-success" onClick={() => markCard(true)}>
          I got it right
        </button>

        <button className="btn btn-danger" onClick={() => markCard(false)}>
          I got it wrong
        </button>
      </div>
    </div>
  );
}

export default FlashcardPractice;