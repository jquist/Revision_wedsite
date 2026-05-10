const fs = require("fs");
const path = require("path");
const createExampleSubject = require("./data/exampleSubject");

const DATA_DIR = path.join(__dirname, "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const USER_DATA_DIR = path.join(DATA_DIR, "user-data");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureUsersFile() {
  ensureDir(DATA_DIR);
  ensureDir(USER_DATA_DIR);

  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsersDb() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
}

function writeUsersDb(usersDb) {
  ensureUsersFile();
  fs.writeFileSync(USERS_PATH, JSON.stringify(usersDb, null, 2));
}

function getUserFolder(userId) {
  return path.join(USER_DATA_DIR, userId);
}

function getSubjectsFolder(userId) {
  return path.join(getUserFolder(userId), "subjects");
}

function getSettingsPath(userId) {
  return path.join(getUserFolder(userId), "settings.json");
}

function safeSubjectFileName(subjectId) {
  return `${String(subjectId).replace(/[^a-zA-Z0-9-_]/g, "-")}.json`;
}

function ensureUserDataArea(userId, { withExampleSubject = false } = {}) {
  const userFolder = getUserFolder(userId);
  const subjectsFolder = getSubjectsFolder(userId);

  ensureDir(userFolder);
  ensureDir(subjectsFolder);

  const settingsPath = getSettingsPath(userId);

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          theme: "default"
        },
        null,
        2
      )
    );
  }

  if (withExampleSubject) {
    const exampleSubject = createExampleSubject();
    const examplePath = path.join(
      subjectsFolder,
      safeSubjectFileName(exampleSubject.subjectId)
    );

    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, JSON.stringify(exampleSubject, null, 2));
    }
  }
}

function getUserByUsername(username) {
  const usersDb = readUsersDb();
  const cleanUsername = String(username || "").toLowerCase().trim();

  return usersDb.users.find(
    (user) => user.username.toLowerCase() === cleanUsername
  );
}

function getUserById(userId) {
  const usersDb = readUsersDb();
  return usersDb.users.find((user) => user.userId === userId);
}

function addUser(user) {
  const usersDb = readUsersDb();
  usersDb.users.push(user);
  writeUsersDb(usersDb);

  ensureUserDataArea(user.userId, { withExampleSubject: true });
}

function listSubjectFiles(userId) {
  ensureUserDataArea(userId);
  const subjectsFolder = getSubjectsFolder(userId);

  return fs
    .readdirSync(subjectsFolder)
    .filter((fileName) => fileName.endsWith(".json"));
}

function getSubjectsForUser(userId) {
  ensureUserDataArea(userId);
  const subjectsFolder = getSubjectsFolder(userId);

  return listSubjectFiles(userId)
    .map((fileName) => {
      const fullPath = path.join(subjectsFolder, fileName);
      return JSON.parse(fs.readFileSync(fullPath, "utf8"));
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

function saveSubjectForUser(userId, subject) {
  ensureUserDataArea(userId);
  const subjectsFolder = getSubjectsFolder(userId);
  const filePath = path.join(subjectsFolder, safeSubjectFileName(subject.subjectId));

  fs.writeFileSync(filePath, JSON.stringify(subject, null, 2));
  return subject;
}

function saveSubjectsForUser(userId, subjects) {
  ensureUserDataArea(userId);
  const subjectsFolder = getSubjectsFolder(userId);

  for (const fileName of listSubjectFiles(userId)) {
    fs.unlinkSync(path.join(subjectsFolder, fileName));
  }

  for (const subject of subjects) {
    saveSubjectForUser(userId, subject);
  }

  return getSubjectsForUser(userId);
}

function deleteSubjectForUser(userId, subjectId) {
  ensureUserDataArea(userId);
  const filePath = path.join(
    getSubjectsFolder(userId),
    safeSubjectFileName(subjectId)
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return getSubjectsForUser(userId);
}

module.exports = {
  addUser,
  deleteSubjectForUser,
  ensureUserDataArea,
  getSubjectsForUser,
  getUserById,
  getUserByUsername,
  saveSubjectForUser,
  saveSubjectsForUser
};
