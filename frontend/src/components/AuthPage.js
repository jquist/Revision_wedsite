import React, { useState } from "react";
import { loginUser, registerUser } from "../utils/api";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("danger");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setMessageType("danger");

    try {
      const result = isLogin
        ? await loginUser({ email, password })
        : await registerUser({ email, password });

      if (result.needsEmailConfirmation) {
        setMessageType("info");
        setMessage(result.message);
        return;
      }

      onLogin(result.user);
    } catch (error) {
      setMessageType("danger");
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setMessageType("danger");
  }

  return (
    <div className="auth-page">
      <div className="auth-card card shadow-sm">
        <div className="card-body">
          <h1 className="mb-2">Revision App</h1>

          <p className="text-muted">
            {isLogin
              ? "Log in to see your saved subjects and progress."
              : "Create an account so your revision data is saved in Supabase."}
          </p>

          <div className="alert alert-info small">
            This version uses Supabase Auth and Supabase Database. No custom
            backend is needed for the no-AI version.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Example: jess@example.com"
                autoComplete="email"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {message && (
              <div className={`alert alert-${messageType} py-2`}>{message}</div>
            )}

            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>

          <hr />

          {isLogin ? (
            <p className="mb-0 text-center">
              No account yet?{" "}
              <button
                className="btn btn-link p-0"
                onClick={() => switchMode("signup")}
              >
                Create one
              </button>
            </p>
          ) : (
            <p className="mb-0 text-center">
              Already have an account?{" "}
              <button
                className="btn btn-link p-0"
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
