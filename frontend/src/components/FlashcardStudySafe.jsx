import React, { useEffect, useMemo, useState } from "react";

/**
 * Safer flashcard component with:
 * - Back button
 * - Index clamping when a filtered card disappears
 * - Prevents x/y crash when filters change after scoring
 *
 * Props:
 * - flashcards
 * - selectedScores: array of scores to include, for example [-3] or [-3, -2]
 * - onUpdateFlashcard(updatedCard)
 * - onExit()
 */
export default function FlashcardStudySafe({
  flashcards = [],
  selectedScores = [],
  onUpdateFlashcard,
  onExit
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const filteredCards = useMemo(() => {
    if (!selectedScores.length) return flashcards;

    return flashcards.filter((card) =>
      selectedScores.includes(Number(card.score || 0))
    );
  }, [flashcards, selectedScores]);

  useEffect(() => {
    if (filteredCards.length === 0) {
      setCurrentIndex(0);
      setShowAnswer(false);
      return;
    }

    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  }, [filteredCards.length, currentIndex]);

  const currentCard = filteredCards[currentIndex];

  function goNext() {
    if (!filteredCards.length) return;

    setCurrentIndex((previous) => {
      const nextIndex = previous + 1;
      return nextIndex >= filteredCards.length ? 0 : nextIndex;
    });

    setShowAnswer(false);
  }

  function goBack() {
    if (!filteredCards.length) return;

    setCurrentIndex((previous) => {
      if (previous <= 0) return filteredCards.length - 1;
      return previous - 1;
    });

    setShowAnswer(false);
  }

  function markCard(isCorrect) {
    if (!currentCard) return;

    const currentScore = Number(currentCard.score || 0);
    const nextScore = isCorrect
      ? Math.min(3, currentScore + 1)
      : Math.max(-3, currentScore - 1);

    const updatedCard = {
      ...currentCard,
      score: nextScore,
      correctCount: Number(currentCard.correctCount || 0) + (isCorrect ? 1 : 0),
      incorrectCount:
        Number(currentCard.incorrectCount || 0) + (isCorrect ? 0 : 1),
      lastReviewed: new Date().toISOString()
    };

    if (onUpdateFlashcard) {
      onUpdateFlashcard(updatedCard);
    }

    /**
     * Do not blindly increment x while y shrinks.
     * The useEffect above will reset to 0 if the current index becomes invalid.
     * This small delay lets the parent update the flashcard list first.
     */
    setTimeout(() => {
      setShowAnswer(false);
      setCurrentIndex((previous) => {
        if (filteredCards.length <= 1) return 0;
        return previous >= filteredCards.length - 1 ? 0 : previous;
      });
    }, 0);
  }

  if (!filteredCards.length) {
    return (
      <section className="revision-glass-card flashcard-study-card">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Flashcards</p>
            <h2>No cards match this filter</h2>
            <p className="muted">
              Try selecting All cards or a different score filter.
            </p>
          </div>
        </div>

        {onExit && (
          <button
            type="button"
            className="revision-btn revision-btn-secondary"
            onClick={onExit}
          >
            Back to Topic
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="revision-glass-card flashcard-study-card">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Flashcards</p>
          <h2>
            Card {currentIndex + 1} of {filteredCards.length}
          </h2>
        </div>

        {onExit && (
          <button
            type="button"
            className="revision-btn revision-btn-secondary"
            onClick={onExit}
          >
            Back to Topic
          </button>
        )}
      </div>

      <div className="flashcard-big">
        <p className="flashcard-label">
          {showAnswer ? "Answer" : "Question"}
        </p>
        <p className="flashcard-main-text">
          {showAnswer
            ? currentCard.answer || currentCard.back
            : currentCard.question || currentCard.front}
        </p>
      </div>

      <div className="button-row spread">
        <button
          type="button"
          className="revision-btn revision-btn-secondary"
          onClick={goBack}
        >
          ← Previous
        </button>

        <button
          type="button"
          className="revision-btn revision-btn-primary"
          onClick={() => setShowAnswer((value) => !value)}
        >
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </button>

        <button
          type="button"
          className="revision-btn revision-btn-secondary"
          onClick={goNext}
        >
          Next →
        </button>
      </div>

      {showAnswer && (
        <div className="button-row center">
          <button
            type="button"
            className="revision-btn revision-btn-danger"
            onClick={() => markCard(false)}
          >
            I got it wrong
          </button>

          <button
            type="button"
            className="revision-btn revision-btn-success"
            onClick={() => markCard(true)}
          >
            I got it right
          </button>
        </div>
      )}
    </section>
  );
}
