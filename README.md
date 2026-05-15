# Revision App — fixed test answers + flashcard scoring

This is the Supabase + Vercel React version.

## Fixes included

- Practice Test answers are stored per question, so the user can answer every question in the exam.
- Each radio group uses a unique name per question, so choosing one option does not unselect answers from other questions.
- Practice Test answer order is shuffled each attempt while the correct answer is tracked by stable IDs.
- Flashcards now use the rule: if the current score is `0` and the user gets it wrong, the score becomes `-3`.

## Setup

### 1. Supabase

Open Supabase SQL Editor and run:

```sql
supabase/schema.sql
```

### 2. Environment variables

Copy:

```bash
cp frontend/.env.example frontend/.env
```

Then fill in:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run locally

```bash
npm run install-all
npm start
```

Or:

```bash
cd frontend
npm install
npm start
```

## Vercel settings

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

Add the same `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` values in Vercel environment variables.
