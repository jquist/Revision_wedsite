# Revision App v8 — AI Generate Topic

This version keeps the v7 user-file backend layout and adds an AI generation feature.

## What changed

- Added backend OpenAI integration.
- Added `POST /api/ai/generate-topic`.
- Added structured JSON output for generated topics.
- Added an `AI Generate` tab inside each subject.
- User can paste lecture text.
- AI returns:
  - summary
  - notes
  - flashcards
  - quiz questions
  - glossary
- User can preview generated JSON.
- User can save the generated topic into the current subject.

## Setup

From this folder:

```bash
npm run install-all
```

Then create:

```txt
backend/.env
```

You can copy:

```txt
backend/.env.example
```

Add your OpenAI API key:

```txt
PORT=4000
JWT_SECRET=change-this-to-a-long-random-secret
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4.1-mini
```

## Run

```bash
npm start
```

Open:

```txt
http://localhost:3000
```

Backend:

```txt
http://localhost:4000
```

## How to use AI

1. Register or log in.
2. Open a subject.
3. Click `AI Generate`.
4. Enter a topic name.
5. Paste lecture text.
6. Click `Generate Topic`.
7. Review the preview.
8. Click `Save Topic`.

## Important

The OpenAI API key must only go in:

```txt
backend/.env
```

Never put it in React/frontend code.

## Current limitation

This version starts with pasted lecture text. PDF/PowerPoint/Word upload can be added later.
