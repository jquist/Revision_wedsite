const topicSchema = {
  type: "object",
  required: [
    "topicId",
    "topicName",
    "sourceFiles",
    "summary",
    "notes",
    "flashcards",
    "quizQuestions",
    "glossary"
  ],
  properties: {
    topicId: {
      type: "string",
      description: "Lowercase URL-safe id for the topic, using hyphens."
    },
    topicName: {
      type: "string"
    },
    sourceFiles: {
      type: "array",
      items: { type: "string" }
    },
    summary: {
      type: "string"
    },
    notes: {
      type: "array",
      items: {
        type: "object",
        required: ["noteId", "heading", "content"],
        properties: {
          noteId: { type: "string" },
          heading: { type: "string" },
          content: { type: "string" }
        }
      }
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        required: [
          "flashcardId",
          "question",
          "answer",
          "difficulty",
          "tags",
          "score",
          "correctCount",
          "incorrectCount",
          "lastReviewed"
        ],
        properties: {
          flashcardId: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" },
          difficulty: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" }
          },
          score: { type: "integer" },
          correctCount: { type: "integer" },
          incorrectCount: { type: "integer" },
          lastReviewed: { type: "string" }
        }
      }
    },
    quizQuestions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "questionId",
          "type",
          "question",
          "options",
          "correctAnswer",
          "explanation"
        ],
        properties: {
          questionId: { type: "string" },
          type: { type: "string" },
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" }
          },
          correctAnswer: { type: "string" },
          explanation: { type: "string" }
        }
      }
    },
    glossary: {
      type: "array",
      items: {
        type: "object",
        required: ["term", "definition"],
        properties: {
          term: { type: "string" },
          definition: { type: "string" }
        }
      }
    }
  }
};

module.exports = topicSchema;
