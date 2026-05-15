export const ALL_TOPICS_ID = "all-topics";

export function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function clampScore(score) {
  return Math.max(-3, Math.min(3, Number(score) || 0));
}

export function getNextFlashcardScore(currentScore, wasCorrect) {
  const score = clampScore(currentScore);

  if (wasCorrect) {
    return clampScore(score + 1);
  }

  // User-requested rule: a fresh/neutral card goes straight to -3 when wrong.
  if (score === 0) {
    return -3;
  }

  return clampScore(score - 1);
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

export function createBlankTopic({ topicName, summary = "", existingTopics = [] }) {
  const cleanName = String(topicName || "").trim();
  const idBase = makeSlug(cleanName) || `topic-${Date.now()}`;
  const existingIds = new Set((existingTopics || []).map((topic) => topic.topicId));

  let topicId = idBase;
  let counter = 2;
  while (existingIds.has(topicId)) {
    topicId = `${idBase}-${counter}`;
    counter += 1;
  }

  return {
    topicId,
    topicName: cleanName || "New Topic",
    sourceFiles: [],
    summary: summary || "New revision topic. Add flashcards, notes, tests, and glossary terms here.",
    notes: [],
    flashcards: [],
    quizQuestions: [],
    glossary: [],
  };
}

export function addTopic(subject, newTopic) {
  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: [...(subject.topics || []), newTopic],
  };
}

export function getSubjectStats(subject) {
  const topics = subject.topics || [];
  const totalFlashcards = topics.reduce((total, topic) => total + (topic.flashcards?.length || 0), 0);
  const totalQuestions = topics.reduce((total, topic) => total + (topic.quizQuestions?.length || 0), 0);
  const totalNotes = topics.reduce((total, topic) => total + (topic.notes?.length || topic.revisionNotes?.length || topic.revision_notes?.length || 0), 0);
  const correctCount = topics.reduce(
    (total, topic) => total + (topic.flashcards || []).reduce((cardTotal, card) => cardTotal + (card.correctCount || 0), 0),
    0
  );
  const incorrectCount = topics.reduce(
    (total, topic) => total + (topic.flashcards || []).reduce((cardTotal, card) => cardTotal + (card.incorrectCount || 0), 0),
    0
  );

  return {
    totalTopics: topics.length,
    totalFlashcards,
    totalQuestions,
    totalNotes,
    correctCount,
    incorrectCount,
  };
}

export function normaliseFlashcard(card, index = 0) {
  return {
    flashcardId: card.flashcardId || card.id || `fc-${index + 1}`,
    question: card.question || card.front || "Untitled card",
    answer: card.answer || card.back || "",
    difficulty: card.difficulty || "medium",
    tags: card.tags || [],
    score: card.score ?? 0,
    correctCount: card.correctCount ?? 0,
    incorrectCount: card.incorrectCount ?? 0,
    lastReviewed: card.lastReviewed ?? null,
    ...card,
  };
}

export function findTopicById(subject, topicId) {
  const topics = subject.topics || [];

  if (topicId === ALL_TOPICS_ID) {
    return {
      topicId: ALL_TOPICS_ID,
      topicName: "All Topics",
      summary: "Combined revision across every topic in this subject.",
      notes: topics.flatMap((topic) =>
        (topic.notes || topic.revisionNotes || topic.revision_notes || []).map((note, index) => ({
          ...note,
          noteId: `${topic.topicId}-${note.noteId || note.id || index}`,
          topicName: topic.topicName,
        }))
      ),
      flashcards: topics.flatMap((topic) =>
        (topic.flashcards || []).map((card, index) => {
          const normalised = normaliseFlashcard(card, index);
          return {
            ...normalised,
            flashcardId: `${topic.topicId}__${normalised.flashcardId}`,
            originalFlashcardId: normalised.flashcardId,
            originalTopicId: topic.topicId,
            topicName: topic.topicName,
          };
        })
      ),
      quizQuestions: topics.flatMap((topic) =>
        (topic.quizQuestions || topic.quiz_questions || []).map((question, index) => ({
          ...question,
          questionId: `${topic.topicId}-${question.questionId || question.quizQuestionId || question.id || index}`,
          topicName: topic.topicName,
        }))
      ),
      glossary: topics.flatMap((topic) =>
        (topic.glossary || []).map((item) => ({
          ...item,
          term: `${item.term} (${topic.topicName})`,
          topicName: topic.topicName,
        }))
      ),
    };
  }

  return topics.find((topic) => topic.topicId === topicId) || topics[0] || createBlankTopic({ topicName: "General" });
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
    topics: (subject.topics || []).map((topic) => {
      if (topic.topicId !== realTopicId) return topic;

      return {
        ...topic,
        flashcards: (topic.flashcards || []).map((card, index) => {
          const normalised = normaliseFlashcard(card, index);
          if (normalised.flashcardId !== realFlashcardId && card.flashcardId !== realFlashcardId && card.id !== realFlashcardId) {
            return card;
          }

          const nextScore = getNextFlashcardScore(normalised.score, wasCorrect);

          return {
            ...card,
            flashcardId: normalised.flashcardId,
            question: normalised.question,
            answer: normalised.answer,
            score: nextScore,
            correctCount: wasCorrect ? (normalised.correctCount || 0) + 1 : normalised.correctCount || 0,
            incorrectCount: wasCorrect ? normalised.incorrectCount || 0 : (normalised.incorrectCount || 0) + 1,
            lastReviewed: new Date().toISOString(),
          };
        }),
      };
    }),
  };
}

export function addFlashcard(subject, topicId, newCard) {
  const targetTopicId = topicId === ALL_TOPICS_ID ? subject.topics[0]?.topicId : topicId;

  return {
    ...subject,
    updatedAt: new Date().toISOString().slice(0, 10),
    topics: (subject.topics || []).map((topic) => {
      if (topic.topicId !== targetTopicId) return topic;

      return {
        ...topic,
        flashcards: [
          ...(topic.flashcards || []),
          {
            flashcardId: `fc-${Date.now()}`,
            question: newCard.question || newCard.front || "",
            answer: newCard.answer || newCard.back || "",
            difficulty: newCard.difficulty || "medium",
            tags: newCard.tags || [],
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
    topics: (subject.topics || []).map((topic) => ({
      ...topic,
      flashcards: (topic.flashcards || []).map((card, index) => {
        const normalised = normaliseFlashcard(card, index);
        const combinedId = `${topic.topicId}__${normalised.flashcardId}`;
        const shouldReset = topicId === ALL_TOPICS_ID
          ? !resetIds || resetIds.has(combinedId)
          : topic.topicId === topicId && (!resetIds || resetIds.has(normalised.flashcardId));

        if (!shouldReset) return card;

        return {
          ...card,
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        };
      }),
    })),
  };
}
