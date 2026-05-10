# Revision App Subject-Per-File Starter

This starter uses one JSON file per subject.

Example structure:

```txt
src/
  data/
    subjects/
      networking.json
      artificial-intelligence.json
    subjectManifest.js
  utils/
    revisionHelpers.js
  components/
  pages/
```

## Install Bootstrap

```bash
npm install bootstrap
```

## Current behaviour

- Dashboard loads multiple subject files.
- Each subject has topics.
- Each topic has notes, flashcards, quiz questions, and glossary terms.
- Flashcards can be marked right or wrong.
- Progress updates in React state.
- Saving is not connected to a backend yet.

## Later backend idea

In a real app, the user could have this structure:

```txt
users/
  user123/
    subjects/
      networking.json
      artificial-intelligence.json
```

Or in a database:

```txt
User
  Subject
    Topic
      Flashcard
      QuizQuestion
      Note
      GlossaryTerm
```