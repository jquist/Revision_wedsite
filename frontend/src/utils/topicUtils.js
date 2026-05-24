export function slugifyTopicName(name) {
  const base = String(name || "topic")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base || "topic";
}

export function createBlankTopic(name = "New Topic") {
  return {
    topicId: `${slugifyTopicName(name)}-${Date.now()}`,
    topicName: name,
    summary: "",
    notes: [],
    flashcards: [],
    quizQuestions: [],
    glossary: [],
    sourceFiles: []
  };
}

export function normaliseTopic(topic) {
  return {
    topicId: topic?.topicId || `topic-${Date.now()}`,
    topicName: topic?.topicName || topic?.title || "Untitled Topic",
    summary: topic?.summary || "",
    notes: Array.isArray(topic?.notes) ? topic.notes : [],
    flashcards: Array.isArray(topic?.flashcards) ? topic.flashcards : [],
    quizQuestions: Array.isArray(topic?.quizQuestions) ? topic.quizQuestions : [],
    glossary: Array.isArray(topic?.glossary) ? topic.glossary : [],
    sourceFiles: Array.isArray(topic?.sourceFiles) ? topic.sourceFiles : []
  };
}

export function addTopicToSubject(subject, topic) {
  const currentTopics = Array.isArray(subject?.topics) ? subject.topics : [];

  return {
    ...subject,
    topics: [...currentTopics, normaliseTopic(topic)],
    updatedAt: new Date().toISOString()
  };
}

export function updateTopicInSubject(subject, updatedTopic) {
  const currentTopics = Array.isArray(subject?.topics) ? subject.topics : [];
  const safeTopic = normaliseTopic(updatedTopic);

  return {
    ...subject,
    topics: currentTopics.map((topic) =>
      topic.topicId === safeTopic.topicId ? safeTopic : topic
    ),
    updatedAt: new Date().toISOString()
  };
}

export function deleteTopicFromSubject(subject, topicId) {
  const currentTopics = Array.isArray(subject?.topics) ? subject.topics : [];

  return {
    ...subject,
    topics: currentTopics.filter((topic) => topic.topicId !== topicId),
    updatedAt: new Date().toISOString()
  };
}

export function makeFlashcard(question = "", answer = "") {
  return {
    flashcardId: `fc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question,
    answer,
    difficulty: "medium",
    tags: [],
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null
  };
}

export function makeQuizQuestion() {
  return {
    questionId: `q-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question: "",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
    difficulty: "medium",
    tags: []
  };
}
