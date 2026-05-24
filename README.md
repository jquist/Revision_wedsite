# Revision Website AI Upgrade Pack

This pack adds the main building blocks for:

- AI file upload flow for larger lecture files
- Topic create/edit/delete UI
- Safer flashcard navigation with a back button
- A more modern/professional visual theme
- Backend helpers for extracting text from PDF/DOCX/PPTX files
- Backend AI JSON generation and chunk merging

These files are written to be plugged into your existing React + Node/Express + Supabase project.

## Suggested install

### Frontend

Copy these files into your React app:

```txt
frontend/src/components/TopicEditorModal.jsx
frontend/src/components/AiUploadPanel.jsx
frontend/src/components/FlashcardStudySafe.jsx
frontend/src/utils/topicUtils.js
frontend/src/lib/supabaseStorage.js
frontend/src/styles/revisionPro.css
```

Then import the CSS once, usually in `src/App.jsx` or `src/index.js`:

```js
import "./styles/revisionPro.css";
```

### Backend

Copy these into your Node backend:

```txt
backend/src/routes/aiRoutes.js
backend/src/services/aiService.js
backend/src/services/fileExtractService.js
backend/src/services/supabaseFileService.js
backend/src/services/jobStore.js
backend/src/utils/safeJson.js
```

Then in your main backend file, usually `server.js` or `index.js`, add:

```js
const aiRoutes = require("./src/routes/aiRoutes");
app.use("/api/ai", aiRoutes);
```

If your backend has a different structure, adjust the import path.

## Backend dependencies

Install these inside your backend folder:

```bash
npm install openai @supabase/supabase-js pdf-parse mammoth adm-zip
```

Optional but useful for PowerPoint extraction:

```bash
npm install officeparser
```

If `officeparser` causes issues, the included PPTX fallback still extracts slide XML text using `adm-zip`.

## Environment variables

Add these to your backend `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_UPLOAD_BUCKET=lecture-files

AI_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
```

You can use Gemini instead:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash
```

## Supabase Storage

Create a private bucket called:

```txt
lecture-files
```

The frontend uploads directly to Supabase Storage. The backend then downloads the file by storage path and extracts text from it.

## Recommended app flow

```txt
1. User opens a subject
2. User clicks "AI Upload"
3. File uploads to Supabase Storage
4. Frontend calls POST /api/ai/generate-topic-from-upload
5. Backend extracts text, chunks it, asks AI for revision JSON
6. Frontend receives topic JSON
7. You append topic to the subject and save it to Supabase
```

## Important note about very large files

For very large PowerPoints, the file itself can be huge because of images/videos, but the extracted text is usually much smaller. This pack extracts text first and only sends text chunks to AI.

For production deployment, large AI jobs are better on a normal backend host such as Render/Railway/Fly.io rather than only Vercel serverless functions.
## Added auth/security files

This version also includes:

```txt
AUTH_SETUP.md
frontend/src/utils/passwordStrength.js
frontend/src/components/PasswordStrengthMeter.jsx
frontend/src/lib/authRedirects.js
frontend/src/lib/authApi.js
frontend/src/pages/ForgotPasswordPage.jsx
frontend/src/pages/ResetPasswordPage.jsx
frontend/src/pages/AuthConfirmedPage.jsx
frontend/src/examples/AuthIntegrationExample.jsx
```

Use `AUTH_SETUP.md` to fix Supabase confirmation/reset links going to localhost.

The important Supabase setting is:

```txt
Authentication → URL Configuration → Site URL
```

Set it to your deployed website URL, then add your production and local URLs to the allow list.
