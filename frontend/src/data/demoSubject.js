export const demoSubject = {
  subjectId: "demo-simple-maths",
  subjectName: "Demo Subject: Simple Maths",
  description:
    "A read-only example subject showing how topics, flashcards, practice tests, notes, and glossary terms work in a realistic revision set.",
  createdAt: "2026-05-16",
  updatedAt: "2026-05-27",
  topics: [
    {
      topicId: "fractions-basics",
      topicName: "Fractions Basics",
      sourceFiles: ["Demo worksheet"],
      summary:
        "A beginner-friendly topic covering numerator, denominator, equivalent fractions, simplifying, and adding simple fractions.",
      notes: [
        {
          noteId: "note-fraction-parts",
          heading: "Parts of a fraction",
          content:
            "The numerator is the top number and tells you how many parts you have. The denominator is the bottom number and tells you how many equal parts the whole has been split into.",
        },
        {
          noteId: "note-equivalent-fractions",
          heading: "Equivalent fractions",
          content:
            "Equivalent fractions look different but have the same value. For example, 1/2, 2/4, and 4/8 are all equivalent because they describe the same amount.",
        },
        {
          noteId: "note-adding-fractions",
          heading: "Adding fractions",
          content:
            "To add fractions with the same denominator, add the numerators and keep the denominator the same. For example, 1/5 + 2/5 = 3/5.",
        },
      ],
      flashcards: [
        {
          flashcardId: "demo-fc-numerator",
          question: "What is the numerator in a fraction?",
          answer: "The numerator is the top number. It shows how many parts are being counted.",
          difficulty: "easy",
          tags: ["fractions"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-denominator",
          question: "What is the denominator in a fraction?",
          answer: "The denominator is the bottom number. It shows how many equal parts the whole is split into.",
          difficulty: "easy",
          tags: ["fractions"],
          score: 1,
          correctCount: 1,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-equivalent",
          question: "Give an equivalent fraction for 1/2.",
          answer: "2/4, 3/6, 4/8, and many others are equivalent to 1/2.",
          difficulty: "easy",
          tags: ["equivalent fractions"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-add-same-denom",
          question: "What is 2/7 + 3/7?",
          answer: "5/7, because the denominators are the same so you add the numerators.",
          difficulty: "medium",
          tags: ["adding fractions"],
          score: -1,
          correctCount: 0,
          incorrectCount: 1,
          lastReviewed: null,
        },
      ],
      quizQuestions: [
        {
          questionId: "demo-q-numerator",
          question: "In the fraction 3/8, which number is the numerator?",
          options: [
            { text: "3", isCorrect: true },
            { text: "8" },
            { text: "11" },
            { text: "5" },
          ],
          explanation: "The numerator is the top number, so in 3/8 the numerator is 3.",
          difficulty: "easy",
          tags: ["fractions"],
        },
        {
          questionId: "demo-q-equivalent",
          question: "Which fraction is equivalent to 1/3?",
          options: [
            { text: "2/6", isCorrect: true },
            { text: "2/3" },
            { text: "3/1" },
            { text: "1/6" },
          ],
          explanation: "1/3 can be multiplied by 2/2 to make 2/6.",
          difficulty: "medium",
          tags: ["equivalent fractions"],
        },
      ],
      glossary: [
        {
          term: "Numerator",
          definition: "The top number in a fraction.",
        },
        {
          term: "Denominator",
          definition: "The bottom number in a fraction.",
        },
        {
          term: "Equivalent fraction",
          definition: "A fraction with the same value as another fraction.",
        },
      ],
    },
    {
      topicId: "algebra-basics",
      topicName: "Algebra Basics",
      sourceFiles: ["Demo worksheet"],
      summary:
        "A simple topic showing how letters can represent unknown values and how equations can be solved step by step.",
      notes: [
        {
          noteId: "note-variable",
          heading: "Variables",
          content:
            "A variable is a letter or symbol that stands for a number. In x + 3 = 7, x is the unknown value.",
        },
        {
          noteId: "note-balancing",
          heading: "Balancing equations",
          content:
            "Whatever you do to one side of an equation, you must do to the other side. This keeps both sides equal.",
        },
        {
          noteId: "note-solving",
          heading: "Solving simple equations",
          content:
            "To solve x + 5 = 12, subtract 5 from both sides. That gives x = 7.",
        },
      ],
      flashcards: [
        {
          flashcardId: "demo-fc-variable",
          question: "What is a variable?",
          answer: "A variable is a letter or symbol that represents an unknown or changing number.",
          difficulty: "easy",
          tags: ["algebra"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-balance",
          question: "Why do we do the same operation to both sides of an equation?",
          answer: "To keep the equation balanced so both sides remain equal.",
          difficulty: "medium",
          tags: ["equations"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-solve-x",
          question: "Solve x + 4 = 10.",
          answer: "x = 6, because subtracting 4 from both sides gives x = 6.",
          difficulty: "medium",
          tags: ["solving equations"],
          score: 2,
          correctCount: 2,
          incorrectCount: 0,
          lastReviewed: null,
        },
      ],
      quizQuestions: [
        {
          questionId: "demo-q-variable",
          question: "In the equation x + 2 = 9, what is x?",
          options: [
            { text: "7", isCorrect: true },
            { text: "9" },
            { text: "11" },
            { text: "2" },
          ],
          explanation: "Subtract 2 from both sides: x = 7.",
          difficulty: "easy",
          tags: ["algebra"],
        },
        {
          questionId: "demo-q-balance",
          question: "What should you do to keep an equation balanced?",
          options: [
            { text: "Do the same operation to both sides", isCorrect: true },
            { text: "Only change the left side" },
            { text: "Always multiply by 10" },
            { text: "Remove the equals sign" },
          ],
          explanation: "Equations stay equal only if both sides are changed in the same way.",
          difficulty: "medium",
          tags: ["equations"],
        },
      ],
      glossary: [
        {
          term: "Variable",
          definition: "A symbol, often a letter, that represents a number.",
        },
        {
          term: "Equation",
          definition: "A mathematical statement showing that two expressions are equal.",
        },
      ],
    },
    {
      topicId: "percentages",
      topicName: "Percentages",
      sourceFiles: ["Demo worksheet"],
      summary:
        "A topic covering what percentages mean, how to find 10%, and how to convert between fractions, decimals, and percentages.",
      notes: [
        {
          noteId: "note-percent-meaning",
          heading: "Meaning of percentage",
          content:
            "Percent means out of 100. So 25% means 25 out of 100.",
        },
        {
          noteId: "note-finding-ten-percent",
          heading: "Finding 10%",
          content:
            "To find 10% of a number, divide the number by 10. For example, 10% of 80 is 8.",
        },
        {
          noteId: "note-percent-decimal",
          heading: "Percentage to decimal",
          content:
            "To change a percentage to a decimal, divide by 100. For example, 45% becomes 0.45.",
        },
      ],
      flashcards: [
        {
          flashcardId: "demo-fc-percent-meaning",
          question: "What does percent mean?",
          answer: "Percent means out of 100.",
          difficulty: "easy",
          tags: ["percentages"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-ten-percent",
          question: "How do you find 10% of a number?",
          answer: "Divide the number by 10.",
          difficulty: "easy",
          tags: ["percentages"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-25-percent",
          question: "What is 25% of 60?",
          answer: "15, because 25% is one quarter and one quarter of 60 is 15.",
          difficulty: "medium",
          tags: ["percentages"],
          score: -2,
          correctCount: 0,
          incorrectCount: 2,
          lastReviewed: null,
        },
      ],
      quizQuestions: [
        {
          questionId: "demo-q-ten-percent",
          question: "What is 10% of 90?",
          options: [
            { text: "9", isCorrect: true },
            { text: "90" },
            { text: "0.9" },
            { text: "19" },
          ],
          explanation: "10% means divide by 10, so 90 ÷ 10 = 9.",
          difficulty: "easy",
          tags: ["percentages"],
        },
        {
          questionId: "demo-q-decimal",
          question: "What is 50% as a decimal?",
          options: [
            { text: "0.5", isCorrect: true },
            { text: "5" },
            { text: "50" },
            { text: "0.05" },
          ],
          explanation: "Divide 50 by 100 to get 0.5.",
          difficulty: "easy",
          tags: ["conversion"],
        },
      ],
      glossary: [
        {
          term: "Percentage",
          definition: "A way of writing a number as parts out of 100.",
        },
        {
          term: "Decimal",
          definition: "A number written using a decimal point.",
        },
      ],
    },
  ],
};
