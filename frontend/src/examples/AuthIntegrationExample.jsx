import React, { useState } from "react";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import {
  signInWithEmailPassword,
  signUpWithSecurePassword,
  resendSignupConfirmation
} from "../lib/authApi";

/**
 * This is an example only.
 * Copy the useful parts into your existing login/signup component.
 */
export default function AuthIntegrationExample() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (mode === "signup") {
        await signUpWithSecurePassword({
          email: email.trim(),
          password
        });

        setMessage(
          "Account created. Please check your email to verify your account."
        );
      } else {
        await signInWithEmailPassword({
          email: email.trim(),
          password
        });

        setMessage("Signed in.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Auth failed.");
    }
  }

  async function handleResendConfirmation() {
    try {
      setStatus("loading");
      await resendSignupConfirmation(email.trim());
      setStatus("success");
      setMessage("Verification email resent.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not resend verification email.");
    }
  }

  return (
    <main className="revision-pro-shell auth-page">
      <section className="revision-glass-card auth-card">
        <p className="eyebrow">Revision Website</p>
        <h1>{mode === "signup" ? "Create account" : "Sign in"}</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Email</span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field-block">
            <span>Password</span>
            <input
              type="password"
              value={password}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === "signup" && (
            <PasswordStrengthMeter password={password} email={email} />
          )}

          {message && (
            <p className={status === "error" ? "error-text" : "status-text"}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className="revision-btn revision-btn-primary"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Working..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="auth-links">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>

          <a href="/forgot-password">Forgot password?</a>

          {mode === "signup" && (
            <button
              type="button"
              className="link-button"
              onClick={handleResendConfirmation}
            >
              Resend verification email
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
