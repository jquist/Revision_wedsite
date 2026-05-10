const topicSchema = {
  type: "object",
  additionalProperties: false,
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
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
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
      minItems: 5,
      maxItems: 16,
      items: {
        type: "object",
        additionalProperties: false,
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
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"]
          },
          tags: {
            type: "array",
            items: { type: "string" }
          },
          score: { type: "integer", enum: [0] },
          correctCount: { type: "integer", enum: [0] },
          incorrectCount: { type: "integer", enum: [0] },
          lastReviewed: { type: "null" }
        }
      }
    },
    quizQuestions: {
      type: "array",
      minItems: 3,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
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
          type: { type: "string", enum: ["multiple-choice"] },
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" }
          },
          correctAnswer: { type: "string" },
          explanation: { type: "string" }
        }
      }
    },
    glossary: {
      type: "array",
      minItems: 3,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
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
