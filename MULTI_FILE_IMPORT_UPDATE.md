# Multi-file AI import update

This version updates the AI import flow so the user can upload one file or several files for the same topic.

## Behaviour

- Frontend file picker now supports multiple files.
- Browser validates:
  - max file count: `REACT_APP_MAX_FILES_PER_IMPORT` or 8 by default
  - max individual file size: `REACT_APP_MAX_UPLOAD_MB` or 75 MB by default
  - max combined upload size: `REACT_APP_MAX_TOTAL_UPLOAD_MB` or 150 MB by default
- Each selected file is uploaded to Supabase Storage using the existing signed upload flow.
- Backend accepts either the old single-file payload or the new `files: []` payload.
- Backend downloads each uploaded file from Supabase Storage, extracts text from each, labels each source, combines the text, and sends it to the AI as one source.
- The generated topic stores `sourceFiles` metadata for all uploaded files.
- The user can either create a new topic or add generated content to an existing topic.

## Environment variables added

Frontend `.env` optional values:

```env
REACT_APP_MAX_UPLOAD_MB=75
REACT_APP_MAX_TOTAL_UPLOAD_MB=150
REACT_APP_MAX_FILES_PER_IMPORT=8
```

Backend `.env` optional values:

```env
MAX_FILE_UPLOAD_MB=75
MAX_TOTAL_UPLOAD_MB=150
MAX_FILES_PER_IMPORT=8
```
