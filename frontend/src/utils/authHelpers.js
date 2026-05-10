const USERS_KEY = "revision-app-users";
const CURRENT_USER_KEY = "revision-app-current-user";

export function getUsers() {
  const users = localStorage.getItem(USERS_KEY);

  if (!users) {
    return [];
  }

  try {
    return JSON.parse(users);
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!currentUser) {
    return null;
  }

  try {
    return JSON.parse(currentUser);
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function makeUserId(username) {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getUserSubjectsKey(userId) {
  return `revision-app-subjects-${userId}`;
}

export function createUser({ username, password }) {
  const users = getUsers();
  const cleanUsername = username.trim();
  const userId = makeUserId(cleanUsername);

  if (!cleanUsername || !password) {
    return {
      success: false,
      message: "Please enter a username and password.",
    };
  }

  if (users.some((user) => user.userId === userId)) {
    return {
      success: false,
      message: "That username already exists.",
    };
  }

  const newUser = {
    userId,
    username: cleanUsername,
    password,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);

  return {
    success: true,
    user: {
      userId: newUser.userId,
      username: newUser.username,
    },
  };
}

export function loginUser({ username, password }) {
  const users = getUsers();
  const userId = makeUserId(username);

  const foundUser = users.find(
    (user) => user.userId === userId && user.password === password
  );

  if (!foundUser) {
    return {
      success: false,
      message: "Username or password is incorrect.",
    };
  }

  return {
    success: true,
    user: {
      userId: foundUser.userId,
      username: foundUser.username,
    },
  };
}
