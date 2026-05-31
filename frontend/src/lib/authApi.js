import { supabase } from "../utils/supabaseClient";
import { AUTH_REDIRECTS } from "./authRedirects";
import { getPasswordError } from "../utils/passwordStrength";

function normaliseAuthError(error) {
  const message = String(error?.message || "");

  if (message.toLowerCase().includes("rate limit")) {
    return new Error("Too many emails have been sent recently. Please wait a while before trying again.");
  }

  return error;
}

function cleanUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validateUsername(value, { required = false } = {}) {
  const username = cleanUsername(value);

  if (!username) {
    if (required) throw new Error("Choose a username.");
    return "";
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error("Usernames must be 3-24 characters and can only use lowercase letters, numbers, and underscores.");
  }

  return username;
}

export async function checkUsernameAvailable(usernameValue) {
  const username = validateUsername(usernameValue, { required: true });

  const { data, error } = await supabase.rpc("is_username_available", {
    search_username: username
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function signUpWithSecurePassword({ email, password, username }) {
  const passwordError = getPasswordError(password, email);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const cleanSignupUsername = validateUsername(username);

  if (cleanSignupUsername) {
    const isAvailable = await checkUsernameAvailable(cleanSignupUsername);
    if (!isAvailable) {
      throw new Error("That username is already taken.");
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: AUTH_REDIRECTS.emailConfirmed(),
      data: cleanSignupUsername ? { username: cleanSignupUsername } : undefined
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmailPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function requestPasswordReset(email) {
  if (!email) {
    throw new Error("Enter your email address.");
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_REDIRECTS.resetPassword()
  });

  if (error) {
    throw normaliseAuthError(error);
  }

  return data;
}

export async function updatePasswordSecurely({ password, email }) {
  const passwordError = getPasswordError(password, email);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const { data, error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resendSignupConfirmation(email) {
  if (!email) {
    throw new Error("Enter your email address.");
  }

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: AUTH_REDIRECTS.emailConfirmed()
    }
  });

  if (error) {
    throw error;
  }

  return data;
}
