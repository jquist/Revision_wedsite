# Revision App v6 — Fullstack Auth Prototype

This version has a React frontend and an Express backend.

## What changed

- Login/register is handled by the backend.
- Passwords are hashed using bcryptjs.
- Login returns a JWT token.
- React sends the JWT token when loading/saving subjects.
- Each user's subjects are stored separately on the backend.
- The backend currently uses a server-side JSON database file:
  - `backend/data/db.json`

This is much better than storing passwords and users directly in React localStorage.

## Run everything

From this folder:

```bash
npm run install-all
npm start
```

Then open:

```txt
http://localhost:3000
```

The backend runs on:

```txt
http://localhost:4000
```

## Backend env

Copy:

```txt
backend/.env.example
```

to:

```txt
backend/.env
```

and change the JWT secret:

```txt
JWT_SECRET=put-a-long-random-secret-here
```

The app will still run without this, but changing it is better.

## Folder structure

```txt
revision-app-v6-fullstack-auth/
  package.json
  frontend/
    package.json
    src/
  backend/
    package.json
    server.js
    db.js
    authMiddleware.js
    data/
      defaultSubjects.js
```

## Important security note

This is now backend-based auth, but it is still a prototype.

Good:
- Passwords are not stored in React.
- Passwords are hashed.
- User data is saved on the backend.
- Users only receive their own subject data through authenticated API routes.

Still needed before real deployment:
- Use HTTPS.
- Use a real database such as PostgreSQL, MySQL, MongoDB, or SQLite.
- Store JWT in safer cookies instead of localStorage.
- Add rate limiting.
- Add password reset.
- Add stronger validation.
- Use a strong production `JWT_SECRET`.
