const fs = require("fs");
const path = require("path");
const defaultSubjects = require("./data/defaultSubjects");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      users: [],
      subjectsByUserId: {}
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUserByUsername(username) {
  const db = readDb();
  const cleanUsername = username.toLowerCase().trim();

  return db.users.find(
    (user) => user.username.toLowerCase() === cleanUsername
  );
}

function getUserById(userId) {
  const db = readDb();
  return db.users.find((user) => user.userId === userId);
}

function addUser(user) {
  const db = readDb();
  db.users.push(user);
  db.subjectsByUserId[user.userId] = JSON.parse(JSON.stringify(defaultSubjects));
  writeDb(db);
}

function getSubjectsForUser(userId) {
  const db = readDb();

  if (!db.subjectsByUserId[userId]) {
    db.subjectsByUserId[userId] = JSON.parse(JSON.stringify(defaultSubjects));
    writeDb(db);
  }

  return db.subjectsByUserId[userId];
}

function saveSubjectsForUser(userId, subjects) {
  const db = readDb();
  db.subjectsByUserId[userId] = subjects;
  writeDb(db);
  return db.subjectsByUserId[userId];
}

module.exports = {
  addUser,
  getSubjectsForUser,
  getUserById,
  getUserByUsername,
  saveSubjectsForUser
};
