const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const TOKEN_KEY = "revision-app-auth-token";
const USER_KEY = "revision-app-auth-user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser() {
  const savedUser = localStorage.getItem(USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export async function registerUser({ username, password }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  saveSession(data);
  return data;
}

export async function loginUser({ username, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  saveSession(data);
  return data;
}

export async function fetchSubjects() {
  const data = await request("/api/subjects");
  return data.subjects;
}

export async function saveAllSubjects(subjects) {
  const data = await request("/api/subjects", {
    method: "PUT",
    body: JSON.stringify({ subjects }),
  });

  return data.subjects;
}

export async function saveSubject(subject) {
  const data = await request(`/api/subjects/${subject.subjectId}`, {
    method: "PUT",
    body: JSON.stringify({ subject }),
  });

  return data.subjects;
}

export async function createSubject(subject) {
  const data = await request("/api/subjects", {
    method: "POST",
    body: JSON.stringify({ subject }),
  });

  return data.subjects;
}
