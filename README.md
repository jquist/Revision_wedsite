# Revision App v9 — Gemini AI Generate Topic

This version keeps the v7 user-file backend layout and changes the AI provider from OpenAI to Gemini.

## What changed

- Removed the OpenAI backend dependency.
- Added Gemini API support through the backend.
- The frontend still calls the same endpoint:
  - `POST /api/ai/generate-topic`
- Gemini returns a topic JSON object containing:
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

Add your Gemini API key:

```txt
PORT=4000
JWT_SECRET=change-this-to-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
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

The Gemini API key must only go in:

```txt
backend/.env
```

Never put it in React/frontend code.

## Current limitation

This version starts with pasted lecture text. PDF/PowerPoint/Word upload can be added later.
