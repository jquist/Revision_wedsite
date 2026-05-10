import React, { useState } from "react";
import { loginUser, registerUser } from "../utils/api";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = isLogin
        ? await loginUser({ username, password })
        : await registerUser({ username, password });

      onLogin(result.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card card shadow-sm">
        <div className="card-body">
          <h1 className="mb-2">Revision App</h1>

          <p className="text-muted">
            {isLogin
              ? "Log in to see your saved subjects and progress."
              : "Create an account so your revision data is saved on the backend."}
          </p>

          <div className="alert alert-info small">
            Backend auth is now being used. Passwords are hashed on the server.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Example: jess"
                autoComplete="username"
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
              <div className="alert alert-danger py-2">{message}</div>
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
