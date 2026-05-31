import React, { useState } from "react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import {
  signInWithEmailPassword,
  signUpWithSecurePassword,
  resendSignupConfirmation,
} from "../lib/authApi";

function AuthPage({ onLogin, onBackToLanding }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const data = await signUpWithSecurePassword({
          email: email.trim(),
          password,
          username,
        });

        if (data.session?.user) {
          onLogin(data.session.user);
        } else {
          setMessage("Account created. Check your email to verify your account.");
        }
      } else {
        const data = await signInWithEmailPassword({
          email: email.trim(),
          password,
        });
        onLogin(data.user);
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    setError("");
    setMessage("");

    try {
      await resendSignupConfirmation(email.trim());
      setMessage("Verification email resent.");
    } catch (resendError) {
      setError(resendError.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="card shadow-sm auth-card">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <h1 className="h3 mb-0">ForgeNotes</h1>
              <p className="text-muted mb-0">Log in to save your subjects, flashcards, and tests.</p>
            </div>
            {onBackToLanding && (
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onBackToLanding}>
                Home
              </button>
            )}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="form-control"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-control"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === "signup" ? 10 : 6}
                required
              />
            </div>
            {mode === "signup" && (
              <div className="mb-3">
                <label className="form-label" htmlFor="username">Username</label>
                <div className="input-group">
                  <span className="input-group-text">@</span>
                  <input
                    id="username"
                    className="form-control"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value.toLowerCase())}
                    minLength={3}
                    maxLength={24}
                    pattern="[a-z0-9_]{3,24}"
                    placeholder="e.g. studyfriend"
                  />
                </div>
                <p className="small text-muted mt-1 mb-0">
                  Optional. Use 3-24 lowercase letters, numbers, or underscores. You can change this later in settings.
                </p>
              </div>
            )}


            {mode === "signup" && (
              <div className="mb-3">
                <PasswordStrengthMeter password={password} email={email} />
              </div>
            )}

            <button className="btn btn-success w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <button
            className="btn btn-link w-100 mt-3"
            type="button"
            onClick={() => {
              setMode((current) => (current === "login" ? "signup" : "login"));
              setUsername("");
              setError("");
              setMessage("");
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>

          <div className="d-grid gap-2 mt-2">
            <a className="btn btn-sm btn-outline-secondary" href="/forgot-password">
              Forgot password?
            </a>

            {mode === "signup" && (
              <button
                className="btn btn-sm btn-outline-primary"
                type="button"
                onClick={handleResendConfirmation}
                disabled={!email.trim()}
              >
                Resend verification email
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
