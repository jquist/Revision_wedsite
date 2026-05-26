import { supabase } from "../supabaseClient";
import { AUTH_REDIRECTS } from "./authRedirects";
import { getPasswordError } from "../utils/passwordStrength";

export async function signUpWithSecurePassword({ email, password }) {
  const passwordError = getPasswordError(password, email);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: AUTH_REDIRECTS.emailConfirmed()
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
    throw error;
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
