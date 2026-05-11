# Revision App v12 — Big Upload Fix

This version fixes common 300MB upload problems.

## What changed from v11

- Frontend API calls now go directly to:
  - `http://localhost:4000`
- This avoids React dev server proxy issues with huge uploads.
- Upload limit increased to 600MB per file.
- Backend server timeouts increased for large local uploads.
- Large extracted text is still split into chunks.
- Gemini still only receives a manageable amount of text, not the whole giant file.

## Setup

From this folder:

```bash
npm run install-all
```

Create:

```txt
backend/.env
```

Use:

```txt
PORT=4000
JWT_SECRET=change-this-to-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash-lite
```

Optional frontend env:

```txt
frontend/.env
```

Use:

```txt
REACT_APP_API_URL=http://localhost:4000
```

The app already defaults to that, so this is optional.

## Run

```bash
npm start
```

Open:

```txt
http://localhost:3000
```

## Important for 300MB files

The upload may take a while. Keep the terminal open and watch the backend console.

If a 300MB PDF is scanned/image-only, text extraction may fail because OCR is not included yet.

## Big file flow

```txt
Upload file
→ backend stores temporary upload on disk
→ backend extracts text
→ backend saves extracted chunks in the user's folder
→ frontend shows chunk cards
→ user chooses a chunk
→ Gemini generates from selected text
```
