export const demoSubject = {
  subjectId: "demo-computer-science",
  subjectName: "Demo Subject: Computer Science",
  description:
    "A read-only example subject showing how flashcards, practice tests, notes, and glossary terms look after revision content has been added.",
  createdAt: "2026-05-16",
  updatedAt: "2026-05-16",
  topics: [
    {
      topicId: "network-security-basics",
      topicName: "Network Security Basics",
      sourceFiles: ["Demo lecture notes"],
      summary:
        "A small demo topic covering firewalls, encryption, phishing, and safe network behaviour.",
      notes: [
        {
          noteId: "note-firewalls",
          heading: "Firewalls",
          content:
            "A firewall filters network traffic using rules. It can block suspicious connections, allow trusted services, and reduce the chance of unwanted access.",
        },
        {
          noteId: "note-encryption",
          heading: "Encryption",
          content:
            "Encryption protects data by turning readable information into unreadable ciphertext. A key is needed to turn it back into readable information.",
        },
        {
          noteId: "note-phishing",
          heading: "Phishing",
          content:
            "Phishing attacks try to trick people into sharing sensitive information. Warning signs include urgent wording, unexpected links, spelling mistakes, and requests for passwords or payment details.",
        },
      ],
      flashcards: [
        {
          flashcardId: "demo-fc-firewall",
          question: "What is the main purpose of a firewall?",
          answer:
            "To monitor and filter network traffic using security rules, helping block unwanted or suspicious connections.",
          difficulty: "easy",
          tags: ["networking", "security"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-encryption",
          question: "Why is encryption useful when sending data online?",
          answer:
            "It helps keep the data private by making it unreadable to people who do not have the correct key.",
          difficulty: "easy",
          tags: ["encryption"],
          score: 1,
          correctCount: 1,
          incorrectCount: 0,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-phishing",
          question: "Name two warning signs of a phishing email.",
          answer:
            "Urgent pressure, suspicious links, spelling mistakes, unexpected attachments, or requests for passwords/payment details.",
          difficulty: "medium",
          tags: ["phishing"],
          score: -1,
          correctCount: 0,
          incorrectCount: 1,
          lastReviewed: null,
        },
        {
          flashcardId: "demo-fc-mfa",
          question: "What does multi-factor authentication add to a login?",
          answer:
            "It adds an extra proof of identity, such as a code, app approval, or security key, alongside the password.",
          difficulty: "medium",
          tags: ["authentication"],
          score: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
        },
      ],
      quizQuestions: [
        {
          questionId: "demo-q-firewall",
          question: "Which statement best describes a firewall?",
          options: [
            { text: "A tool that filters network traffic using rules", isCorrect: true },
            { text: "A type of password manager" },
            { text: "A file format for encrypted images" },
            { text: "A website used to download software updates" },
          ],
          explanation:
            "A firewall is used to control traffic entering or leaving a device or network.",
          difficulty: "easy",
          tags: ["firewall"],
        },
        {
          questionId: "demo-q-phishing",
          question: "Which action is safest if an unexpected email asks you to reset your password using a link?",
          options: [
            { text: "Click the link quickly before the account is closed" },
            { text: "Reply with your password so support can check it" },
            { text: "Open the official website yourself and check the account from there", isCorrect: true },
            { text: "Forward the email to friends to ask if it is real" },
          ],
          explanation:
            "Going through the official website avoids trusting a potentially fake link.",
          difficulty: "medium",
          tags: ["phishing"],
        },
        {
          questionId: "demo-q-mfa",
          question: "Why does multi-factor authentication improve security?",
          options: [
            { text: "It removes the need to remember anything" },
            { text: "It means an attacker usually needs more than just the password", isCorrect: true },
            { text: "It makes every website load faster" },
            { text: "It stops all spam emails from arriving" },
          ],
          explanation:
            "MFA adds another check, so a stolen password alone may not be enough.",
          difficulty: "medium",
          tags: ["authentication"],
        },
      ],
      glossary: [
        {
          term: "Firewall",
          definition:
            "A security system that controls allowed and blocked network traffic based on rules.",
        },
        {
          term: "Encryption",
          definition:
            "A method of scrambling data so only someone with the right key can read it.",
        },
        {
          term: "Phishing",
          definition:
            "A social engineering attack that tricks people into revealing information or clicking unsafe links.",
        },
        {
          term: "Multi-factor authentication",
          definition:
            "A login method that uses more than one proof of identity, such as a password plus a one-time code.",
        },
      ],
    },
  ],
};
