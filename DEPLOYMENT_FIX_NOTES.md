# Deployment fix notes

This zip includes the multi-file AI import update plus a Vercel install fix.

## What changed

- Removed generated `package-lock.json` files that contained internal package registry URLs from the build environment. Those URLs can make Vercel/Render `npm install` hang or fail.
- Added `.npmrc` settings for public npm registry, no audit/fund output, and legacy peer deps.
- Pinned the project to Node 20 / npm 10 to avoid the Vercel npm 11.2.1 `Exit handler never called` install bug shown in the failed build.
- Added root `vercel.json` and frontend `vercel.json` build settings.
- Renamed the visible app from Revision App to ForgeNotes.
- Changed visible `practice` wording to `practice`.

## Vercel settings

If your Vercel project root is the repo root, use:

- Install command: `cd frontend && npm install --no-audit --no-fund --legacy-peer-deps`
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/build`

If your Vercel project root is `frontend`, use:

- Install command: `npm install --no-audit --no-fund --legacy-peer-deps`
- Build command: `npm run build`
- Output directory: `build`
