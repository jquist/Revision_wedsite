# AI JSON template note

The app still accepts your existing quiz question format:

```json
{
  "questionId": "q1",
  "question": "What is DNS?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "B",
  "explanation": "..."
}
```

For the safest random answer ordering, use option IDs:

```json
{
  "questionId": "q1",
  "question": "What is DNS?",
  "options": [
    { "optionId": "q1-a", "text": "A storage device" },
    { "optionId": "q1-b", "text": "A system that translates domain names into IP addresses" },
    { "optionId": "q1-c", "text": "A type of firewall" },
    { "optionId": "q1-d", "text": "A programming language" }
  ],
  "correctOptionId": "q1-b",
  "explanation": "DNS translates names such as example.com into IP addresses.",
  "difficulty": "easy",
  "tags": ["dns"]
}
```

The database stores `correctOptionId`, while the quiz page shuffles the visible order each time.
