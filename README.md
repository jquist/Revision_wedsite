# Revision App — Vercel + Supabase Version

This is the no-AI deployment version of the revision app.

It uses:

- React / Create React App for the website
- Supabase Auth for sign up and log in
- Supabase Postgres for saved subjects and progress
- Vercel for frontend hosting

There is no custom Express backend in this version.

## Project structure

```txt
revision-app-supabase-vercel/
  frontend/
    public/
    src/
    package.json
    .env.example
  supabase/
    schema.sql
  package.json
  README.md
```

## Local setup

### 1. Create a Supabase project

Create a new project in Supabase.

Then copy:

- Project URL
- anon/public key

You find them in Supabase project settings under API.

### 2. Create the database table

Open Supabase SQL Editor and run:

```txt
supabase/schema.sql
```

This creates the `subjects` table and Row Level Security policies.

### 3. Add frontend environment variables

Copy:

```bash
cp frontend/.env.example frontend/.env
```

Then fill in:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not put the Supabase service role key in React.

### 4. Install and run

From the project root:

```bash
npm run install-all
npm start
```

Or directly:

```bash
cd frontend
npm install
npm start
```

The app should run on:

```txt
http://localhost:3000
```

## Auth note

Supabase may require new users to confirm their email before logging in.

For quick local testing, you can turn email confirmation off in Supabase:

```txt
Authentication → Sign In / Providers → Email → Confirm email = off
```

For production, it is usually better to keep email confirmation on.

## Vercel settings

When deploying on Vercel:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: build
```

Add these Vercel environment variables:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then redeploy.

## Supabase table design

The app saves each subject as one JSONB row:

```txt
subjects
- id
- user_id
- subject_id
- subject_name
- subject
- created_at
- updated_at
```

The full subject object contains the topics, notes, flashcards, quiz questions, glossary, and card progress.
