export const ALL_TOPICS_ID = "all-topics";

export function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function clampScore(score) {
  return Math.max(-3, Math.min(3, score));
}

export function createBlankSubject({ subjectName, description }) {
  const idBase = makeSlug(subjectName) || `subject-${Date.now()}`;

  return {
    subjectId: `${idBase}-${Date.now()}`,
    subjectName,
    description: description || "New revision subject.",
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: [
      {
        topicId: "general",
        topicName: "General",
        sourceFiles: [],
        summary: "General revision topic. Add flashcards, notes, tests, and glossary terms here.",
        notes: [],
        flashcards: [],
        quizQuestions: [],
        glossary: [],
      },
    ],
  };
}

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
  if (topicId === ALL_TOPICS_ID) {
    return {
      topicId: ALL_TOPICS_ID,
      topicName: "All Topics",
      summary: "Combined revision across every topic in this subject.",
      notes: subject.topics.flatMap((topic) =>
        (topic.notes || []).map((note) => ({
          ...note,
          noteId: `${topic.topicId}-${note.noteId}`,
          topicName: topic.topicName,
        }))
      ),
      flashcards: subject.topics.flatMap((topic) =>
        (topic.flashcards || []).map((card) => ({
          ...card,
          flashcardId: `${topic.topicId}__${card.flashcardId}`,
          originalFlashcardId: card.flashcardId,
          originalTopicId: topic.topicId,
          topicName: topic.topicName,
        }))
      ),
      quizQuestions: subject.topics.flatMap((topic) =>
        (topic.quizQuestions || []).map((question) => ({
          ...question,
          questionId: `${topic.topicId}-${question.questionId}`,
          topicName: topic.topicName,
        }))
      ),
      glossary: subject.topics.flatMap((topic) =>
        (topic.glossary || []).map((item) => ({
          ...item,
          term: `${item.term} (${topic.topicName})`,
          topicName: topic.topicName,
        }))
      ),
    };
  }

  return subject.topics.find((topic) => topic.topicId === topicId);
}

export function updateFlashcardProgress(subject, topicId, flashcardId, wasCorrect) {
  const realTopicId = topicId === ALL_TOPICS_ID && flashcardId.includes("__")
    ? flashcardId.split("__")[0]
    : topicId;

  const realFlashcardId = flashcardId.includes("__")
    ? flashcardId.split("__")[1]
    : flashcardId;

  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: subject.topics.map((topic) => {
      if (topic.topicId !== realTopicId) {
        return topic;
      }

      return {
        ...topic,
        flashcards: topic.flashcards.map((card) => {
          if (card.flashcardId !== realFlashcardId) {
            return card;
          }

          const currentScore = card.score || 0;
          const nextScore = clampScore(wasCorrect ? currentScore + 1 : currentScore - 1);

          return {
            ...card,
            score: nextScore,
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

export function addFlashcard(subject, topicId, newCard) {
  const targetTopicId = topicId === ALL_TOPICS_ID
    ? subject.topics[0].topicId
    : topicId;

  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: subject.topics.map((topic) => {
      if (topic.topicId !== targetTopicId) {
        return topic;
      }

      return {
        ...topic,
        flashcards: [
          ...topic.flashcards,
          {
            flashcardId: `fc-${Date.now()}`,
            difficulty: "medium",
            tags: [],
            score: 0,
            correctCount: 0,
            incorrectCount: 0,
            lastReviewed: null,
            ...newCard,
          },
        ],
      };
    }),
  };
}


export function resetFlashcardStats(subject, topicId, flashcardIdsToReset = null) {
  const resetIds = flashcardIdsToReset ? new Set(flashcardIdsToReset) : null;

  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: subject.topics.map((topic) => {
      return {
        ...topic,
        flashcards: topic.flashcards.map((card) => {
          const combinedId = `${topic.topicId}__${card.flashcardId}`;
          const shouldReset =
            topicId === ALL_TOPICS_ID
              ? !resetIds || resetIds.has(combinedId)
              : topic.topicId === topicId && (!resetIds || resetIds.has(card.flashcardId));

          if (!shouldReset) {
            return card;
          }

          return {
            ...card,
            score: 0,
            correctCount: 0,
            incorrectCount: 0,
            lastReviewed: null,
          };
        }),
      };
    }),
  };
}


export function addTopicToSubject(subject, generatedTopic) {
  const existingTopicIds = new Set(subject.topics.map((topic) => topic.topicId));
  let topicId = generatedTopic.topicId || makeSlug(generatedTopic.topicName);
  let finalTopicId = topicId;
  let counter = 2;

  while (existingTopicIds.has(finalTopicId)) {
    finalTopicId = `${topicId}-${counter}`;
    counter += 1;
  }

  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: [
      ...subject.topics,
      {
        ...generatedTopic,
        topicId: finalTopicId,
      },
    ],
  };
}
