import React, { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "../utils/authHelpers";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const data = await signUpWithEmail(email, password);
        if (data.session?.user) {
          onLogin(data.session.user);
        } else {
          setMessage("Account created. Check your email if Supabase asks for confirmation.");
        }
      } else {
        const data = await signInWithEmail(email, password);
        onLogin(data.user);
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="card shadow-sm auth-card">
        <div className="card-body p-4">
          <h1 className="h3 mb-2">Revision App</h1>
          <p className="text-muted">Log in to save your subjects, flashcards, and tests.</p>

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
                minLength="6"
                required
              />
            </div>
            <button className="btn btn-success w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <button
            className="btn btn-link w-100 mt-3"
            onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
