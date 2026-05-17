import React, { useEffect, useMemo, useState } from "react";

const ROUND_SIZE_OPTIONS = [4, 6, 8, 10];

function shuffleArray(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function getCardKey(card) {
  if (card.originalTopicId) {
    return `${card.originalTopicId}__${card.originalFlashcardId || card.flashcardId}`;
  }

  return card.flashcardId;
}

function getProgressUpdate(card, selectedTopicId, wasCorrect) {
  return {
    topicId: card.originalTopicId || selectedTopicId,
    flashcardId: card.originalFlashcardId || card.flashcardId,
    wasCorrect,
  };
}

function FlashcardGames({ flashcards, selectedTopicId, onMarkFlashcards, isDemo = false }) {
  const usableFlashcards = useMemo(
    () => (flashcards || []).filter((card) => card.question && card.answer),
    [flashcards]
  );

  const [gameType, setGameType] = useState("match");
  const [roundSize, setRoundSize] = useState(6);
  const [roundCards, setRoundCards] = useState([]);
  const [answerCards, setAnswerCards] = useState([]);
  const [quizChoices, setQuizChoices] = useState({});
  const [matchSelections, setMatchSelections] = useState({});
  const [quizSelections, setQuizSelections] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const sourceSignature = useMemo(
    () => usableFlashcards.map((card) => getCardKey(card)).join("|"),
    [usableFlashcards]
  );

  function buildRound() {
    if (usableFlashcards.length < 2) {
      setRoundCards([]);
      setAnswerCards([]);
      setQuizChoices({});
      setMatchSelections({});
      setQuizSelections({});
      setSubmitted(false);
      setResult(null);
      return;
    }

    const size = Math.min(roundSize, usableFlashcards.length);
    const nextRoundCards = shuffleArray(usableFlashcards).slice(0, size);
    const nextAnswerCards = shuffleArray(nextRoundCards);
    const nextQuizChoices = {};

    nextRoundCards.forEach((card) => {
      const cardKey = getCardKey(card);
      const wrongAnswers = shuffleArray(
        usableFlashcards.filter((possibleAnswer) => getCardKey(possibleAnswer) !== cardKey)
      ).slice(0, 3);

      nextQuizChoices[cardKey] = shuffleArray([card, ...wrongAnswers]);
    });

    setRoundCards(nextRoundCards);
    setAnswerCards(nextAnswerCards);
    setQuizChoices(nextQuizChoices);
    setMatchSelections({});
    setQuizSelections({});
    setSubmitted(false);
    setResult(null);
  }

  useEffect(() => {
    if (!submitted) {
      buildRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSignature, roundSize, gameType]);

  function changeGameType(nextGameType) {
    setGameType(nextGameType);
    setSubmitted(false);
    setResult(null);
  }

  function changeRoundSize(event) {
    setRoundSize(Number(event.target.value));
    setSubmitted(false);
    setResult(null);
  }

  function recordRoundResults(roundResults) {
    const correctCount = roundResults.filter((item) => item.wasCorrect).length;
    const progressUpdates = roundResults.map((item) =>
      getProgressUpdate(item.card, selectedTopicId, item.wasCorrect)
    );

    setSubmitted(true);
    setResult({ correctCount, total: roundResults.length, roundResults });

    if (onMarkFlashcards) {
      onMarkFlashcards(progressUpdates);
    }
  }

  function submitMatchGame() {
    const roundResults = roundCards.map((card) => {
      const cardKey = getCardKey(card);
      return {
        card,
        selectedAnswerKey: matchSelections[cardKey],
        wasCorrect: matchSelections[cardKey] === cardKey,
      };
    });

    recordRoundResults(roundResults);
  }

  function submitQuizGame() {
    const roundResults = roundCards.map((card) => {
      const cardKey = getCardKey(card);
      return {
        card,
        selectedAnswerKey: quizSelections[cardKey],
        wasCorrect: quizSelections[cardKey] === cardKey,
      };
    });

    recordRoundResults(roundResults);
  }

  const matchReady = roundCards.length > 0 && roundCards.every((card) => matchSelections[getCardKey(card)]);
  const quizReady = roundCards.length > 0 && roundCards.every((card) => quizSelections[getCardKey(card)]);

  if (usableFlashcards.length < 2) {
    return (
      <div className="card revision-card shadow-sm">
        <div className="card-body">
          <h3 className="h5">Flashcard games</h3>
          <p className="text-muted mb-0">You need at least 2 flashcards in the current score filter to play a game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card revision-card shadow-sm flashcard-games-card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h3 className="h5 mb-1">Flashcard games</h3>
            <p className="text-muted mb-0">
              These use the current topic and score filters above, so you can practise only cards like -3 or -2.
              {isDemo ? " Demo scores reset when you leave." : ""}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn ${gameType === "match" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => changeGameType("match")}
            >
              Match
            </button>
            <button
              className={`btn ${gameType === "quiz" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => changeGameType("quiz")}
            >
              Quick Quiz
            </button>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <label className="form-label mb-0" htmlFor="flashcard-game-round-size">Cards this round</label>
          <select
            id="flashcard-game-round-size"
            className="form-select form-select-sm flashcard-game-size-select"
            value={roundSize}
            onChange={changeRoundSize}
          >
            {ROUND_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {Math.min(size, usableFlashcards.length)} cards
              </option>
            ))}
          </select>
          <button className="btn btn-outline-secondary btn-sm" onClick={buildRound}>
            New round
          </button>
          <span className="small text-muted">Available in this filter: {usableFlashcards.length}</span>
        </div>

        {result && (
          <div className={`alert ${result.correctCount === result.total ? "alert-success" : "alert-warning"}`}>
            You got {result.correctCount} out of {result.total} correct.
          </div>
        )}

        {gameType === "match" ? (
          <div>
            <div className="row g-3">
              <div className="col-lg-7">
                <h4 className="h6">Questions</h4>
                <div className="d-grid gap-2">
                  {roundCards.map((card, index) => {
                    const cardKey = getCardKey(card);
                    const selectedAnswerKey = matchSelections[cardKey] || "";
                    const resultItem = result?.roundResults.find((item) => getCardKey(item.card) === cardKey);

                    return (
                      <div className="match-question-row" key={cardKey}>
                        <div>
                          <strong>{index + 1}.</strong> {card.question}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <label className="small text-muted mb-0" htmlFor={`match-answer-${cardKey}`}>Answer number</label>
                          <select
                            id={`match-answer-${cardKey}`}
                            className="form-select form-select-sm match-answer-select"
                            value={selectedAnswerKey}
                            onChange={(event) =>
                              setMatchSelections((currentSelections) => ({
                                ...currentSelections,
                                [cardKey]: event.target.value,
                              }))
                            }
                            disabled={submitted}
                          >
                            <option value="">Choose...</option>
                            {answerCards.map((answerCard, answerIndex) => (
                              <option key={getCardKey(answerCard)} value={getCardKey(answerCard)}>
                                {answerIndex + 1}
                              </option>
                            ))}
                          </select>
                          {resultItem && (
                            <span className={`badge ${resultItem.wasCorrect ? "text-bg-success" : "text-bg-danger"}`}>
                              {resultItem.wasCorrect ? "Correct" : "Wrong"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-lg-5">
                <h4 className="h6">Answer bank</h4>
                <ol className="game-answer-bank">
                  {answerCards.map((card) => (
                    <li key={getCardKey(card)}>{card.answer}</li>
                  ))}
                </ol>
              </div>
            </div>

            <button className="btn btn-success mt-3" onClick={submitMatchGame} disabled={!matchReady || submitted}>
              Check matches
            </button>
          </div>
        ) : (
          <div>
            <div className="d-grid gap-3">
              {roundCards.map((card, index) => {
                const cardKey = getCardKey(card);
                const selectedAnswerKey = quizSelections[cardKey] || "";
                const resultItem = result?.roundResults.find((item) => getCardKey(item.card) === cardKey);

                return (
                  <div className="quick-quiz-question" key={cardKey}>
                    <div className="mb-2">
                      <strong>{index + 1}.</strong> {card.question}
                    </div>
                    <div className="d-grid gap-2">
                      {(quizChoices[cardKey] || []).map((answerCard, answerIndex) => {
                        const answerKey = getCardKey(answerCard);
                        const isSelected = selectedAnswerKey === answerKey;
                        const isCorrectAnswer = submitted && answerKey === cardKey;
                        const isWrongSelected = submitted && isSelected && answerKey !== cardKey;

                        return (
                          <button
                            type="button"
                            key={answerKey}
                            className={`btn text-start ${
                              isCorrectAnswer
                                ? "btn-success"
                                : isWrongSelected
                                ? "btn-danger"
                                : isSelected
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() =>
                              setQuizSelections((currentSelections) => ({
                                ...currentSelections,
                                [cardKey]: answerKey,
                              }))
                            }
                            disabled={submitted}
                          >
                            <strong>{answerIndex + 1}.</strong> {answerCard.answer}
                          </button>
                        );
                      })}
                    </div>
                    {resultItem && (
                      <div className="small mt-2 text-muted">
                        {resultItem.wasCorrect ? "Correct." : `Correct answer: ${card.answer}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="btn btn-success mt-3" onClick={submitQuizGame} disabled={!quizReady || submitted}>
              Check quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlashcardGames;
