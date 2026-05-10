export function getSubjectStats(subject) {
  const topics = subject.topics || [];

  const totalFlashcards = topics.reduce(
    (total, topic) => total + (topic.flashcards?.length || 0),
    0
  );

  const totalQuestions = topics.reduce(
    (total, topic) => total + (topic.quizQuestions?.length || 0),
    0
  );

  const totalNotes = topics.reduce(
    (total, topic) => total + (topic.notes?.length || 0),
    0
  );

  const correctCount = topics.reduce((total, topic) => {
    return (
      total +
      (topic.flashcards || []).reduce(
        (cardTotal, card) => cardTotal + (card.correctCount || 0),
        0
      )
    );
  }, 0);

  const incorrectCount = topics.reduce((total, topic) => {
    return (
      total +
      (topic.flashcards || []).reduce(
        (cardTotal, card) => cardTotal + (card.incorrectCount || 0),
        0
      )
    );
  }, 0);

  return {
    totalTopics: topics.length,
    totalFlashcards,
    totalQuestions,
    totalNotes,
    correctCount,
    incorrectCount,
  };
}

export function findTopicById(subject, topicId) {
  return subject.topics.find((topic) => topic.topicId === topicId);
}

export function updateFlashcardProgress(subject, topicId, flashcardId, wasCorrect) {
  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: subject.topics.map((topic) => {
      if (topic.topicId !== topicId) {
        return topic;
      }

      return {
        ...topic,
        flashcards: topic.flashcards.map((card) => {
          if (card.flashcardId !== flashcardId) {
            return card;
          }

          return {
            ...card,
            correctCount: wasCorrect
              ? (card.correctCount || 0) + 1
              : card.correctCount || 0,
            incorrectCount: wasCorrect
              ? card.incorrectCount || 0
              : (card.incorrectCount || 0) + 1,
            lastReviewed: new Date().toISOString(),
          };
        }),
      };
    }),
  };
}