require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const requireAuth = require("./authMiddleware");
const aiRoutes = require("./routes/aiRoutes");
const {
  addUser,
  deleteSubjectForUser,
  getSubjectsForUser,
  getUserByUsername,
  saveSubjectForUser,
  saveSubjectsForUser
} = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: "5mb" }));

app.use("/api/ai", aiRoutes);

function createToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeUser(user) {
  return {
    userId: user.userId,
    username: user.username
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Revision backend running." });
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existingUser = getUserByUsername(username);

  if (existingUser) {
    return res.status(409).json({ message: "That username already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = {
    userId: uuidv4(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  addUser(newUser);

  const token = createToken(newUser);

  res.status(201).json({
    token,
    user: safeUser(newUser)
  });
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  const user = getUserByUsername(username);

  if (!user) {
    return res.status(401).json({ message: "Username or password is incorrect." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Username or password is incorrect." });
  }

  const token = createToken(user);

  res.json({
    token,
    user: safeUser(user)
  });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/subjects", requireAuth, (req, res) => {
  const subjects = getSubjectsForUser(req.user.userId);
  res.json({ subjects });
});

app.put("/api/subjects", requireAuth, (req, res) => {
  const subjects = Array.isArray(req.body.subjects) ? req.body.subjects : [];

  const savedSubjects = saveSubjectsForUser(req.user.userId, subjects);

  res.json({ subjects: savedSubjects });
});

app.put("/api/subjects/:subjectId", requireAuth, (req, res) => {
  const updatedSubject = req.body.subject;

  if (!updatedSubject || updatedSubject.subjectId !== req.params.subjectId) {
    return res.status(400).json({ message: "Valid subject data is required." });
  }

  saveSubjectForUser(req.user.userId, updatedSubject);

  res.json({ subjects: getSubjectsForUser(req.user.userId) });
});

app.post("/api/subjects", requireAuth, (req, res) => {
  const newSubject = req.body.subject;

  if (!newSubject || !newSubject.subjectId) {
    return res.status(400).json({ message: "Valid subject data is required." });
  }

  saveSubjectForUser(req.user.userId, newSubject);

  res.status(201).json({
    subjects: getSubjectsForUser(req.user.userId),
    subject: newSubject
  });
});

app.delete("/api/subjects/:subjectId", requireAuth, (req, res) => {
  const savedSubjects = deleteSubjectForUser(
    req.user.userId,
    req.params.subjectId
  );

  res.json({ subjects: savedSubjects });
});

const server = app.listen(PORT, () => {
  console.log(`Revision backend running on http://localhost:${PORT}`);
});

// Large local file uploads can take longer than the default timeout.
server.requestTimeout = 15 * 60 * 1000;
server.headersTimeout = 16 * 60 * 1000;
server.keepAliveTimeout = 2 * 60 * 1000;
