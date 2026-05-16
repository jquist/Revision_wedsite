import React, { useEffect, useMemo, useState } from "react";
import AddFlashcardForm from "./AddFlashcardForm";
import { getNextFlashcardScore, normaliseFlashcard } from "../utils/revisionHelpers";

const SCORE_FILTERS = [3, 2, 1, 0, -1, -2, -3];

function FlashcardPractice({ topic, selectedTopicId, onMarkFlashcard, onAddFlashcard, onRefreshCardStats, readOnly = false, isDemo = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedScores, setSelectedScores] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const allFlashcards = useMemo(
    () => (topic.flashcards || []).map((card, index) => normaliseFlashcard(card, index)),
    [topic.flashcards]
  );

  const filteredFlashcards = useMemo(() => {
    if (selectedScores.length === 0) return allFlashcards;
    return allFlashcards.filter((card) => selectedScores.includes(card.score ?? 0));
  }, [allFlashcards, selectedScores]);

  const flashcards = filteredFlashcards;

  useEffect(() => {
    if (flashcards.length === 0) {
      setCurrentIndex(0);
      setShowAnswer(false);
      return;
    }

    if (currentIndex >= flashcards.length) {
      setCurrentIndex(flashcards.length - 1);
      setShowAnswer(false);
    }
  }, [currentIndex, flashcards.length]);

  function resetCardPosition() {
    setCurrentIndex(0);
    setShowAnswer(false);
  }

  function toggleScoreFilter(score) {
    setSelectedScores((currentScores) => {
      if (currentScores.includes(score)) {
        return currentScores.filter((currentScore) => currentScore !== score);
      }
      return [...currentScores, score].sort((a, b) => b - a);
    });
    resetCardPosition();
  }

  function showAllCards() {
    setSelectedScores([]);
    resetCardPosition();
  }

  function refreshCards() {
    const visibleFlashcardIds = flashcards.map((card) =>
      card.originalTopicId ? `${card.originalTopicId}__${card.originalFlashcardId}` : card.flashcardId
    );
    onRefreshCardStats(visibleFlashcardIds);
    resetCardPosition();
  }

  function goNext() {
    setShowAnswer(false);
    setCurrentIndex((previous) => (previous >= flashcards.length - 1 ? 0 : previous + 1));
  }

  function stayOnCurrentSlotAfterFilteredCardLeaves() {
    setShowAnswer(false);
    setCurrentIndex((previous) => Math.max(0, previous));
  }

  function markCard(wasCorrect) {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    const nextScore = getNextFlashcardScore(currentCard.score ?? 0, wasCorrect);
    const cardWillStillBeVisible = selectedScores.length === 0 || selectedScores.includes(nextScore);

    onMarkFlashcard(
      currentCard.originalTopicId || selectedTopicId,
      currentCard.originalFlashcardId || currentCard.flashcardId,
      wasCorrect
    );

    // If a score filter is active and the card's new score leaves the filter,
    // the list length decreases. In that case do NOT also increase the index,
    // or the next card gets skipped and the counter can go out of range.
    if (cardWillStillBeVisible) {
      goNext();
    } else {
      stayOnCurrentSlotAfterFilteredCardLeaves();
    }
  }

  function handleAddFlashcard(newCard) {
    onAddFlashcard(newCard);
    setShowAddForm(false);
    showAllCards();
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2>Flashcards</h2>
          <p className="text-muted mb-0">
            Select one or more scores. Correct answers add 1. Wrong answers subtract 1, except score 0 goes straight to -3.
          </p>
        </div>
        {!readOnly && (
          <button className="btn btn-outline-primary" onClick={() => setShowAddForm((current) => !current)}>
            {showAddForm ? "Close add card" : "Add new card"}
          </button>
        )}
      </div>

      {!readOnly && showAddForm && <AddFlashcardForm onAddFlashcard={handleAddFlashcard} />}

      <div className="filter-panel mb-3">
        <div className="d-flex flex-wrap gap-2">
          {SCORE_FILTERS.map((score) => {
            const isSelected = selectedScores.includes(score);
            return (
              <button
                key={score}
                className={`btn ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => toggleScoreFilter(score)}
              >
                {score > 0 ? `+${score}` : score}
              </button>
            );
          })}
          <button
            className={`btn ${selectedScores.length === 0 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={showAllCards}
          >
            All Cards
          </button>
          {!readOnly && (
            <button className="btn btn-outline-secondary" onClick={refreshCards} disabled={flashcards.length === 0}>
              Refresh Cards
            </button>
          )}
        </div>
      </div>

      {flashcards.length === 0 ? (
        <p>No flashcards match this filter yet.</p>
      ) : (
        <>
          <div className="card shadow-sm mb-3 revision-card">
            <div className="card-body">
              <p className="text-muted">
                Card {currentIndex + 1} of {flashcards.length}
                {currentCard.topicName ? ` • ${currentCard.topicName}` : ""}
              </p>
              <h4>{currentCard.question}</h4>

              {showAnswer && <div className="alert alert-success mt-3">{currentCard.answer}</div>}

              <div className="small text-muted mb-3">
                Score: {currentCard.score ?? 0} | Correct: {currentCard.correctCount || 0} | Incorrect: {currentCard.incorrectCount || 0}
                {isDemo ? " | demo progress resets when you leave" : ""}
              </div>

              <button className="btn btn-primary me-2" onClick={() => setShowAnswer(!showAnswer)}>
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
        </>
      )}
    </div>
  );
}

export default FlashcardPractice;
