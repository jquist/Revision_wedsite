import React, { useState } from "react";
import { requestPasswordReset } from "../lib/authApi";
import SiteFooter from "../components/SiteFooter";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await requestPasswordReset(email.trim());

      setStatus("success");
      setMessage("If an account exists for that email, a password reset link has been sent.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not send reset email.");
    }
  }

  return (
    <>
    <main className="revision-pro-shell auth-page">
      <section className="revision-glass-card auth-card">
        <p className="eyebrow">Account Help</p>
        <h1>Reset your password</h1>
        <p className="muted">Enter your account email and we’ll send a secure reset link.</p>

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
            {status === "loading" ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
