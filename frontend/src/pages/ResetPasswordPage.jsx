import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { updatePasswordSecurely } from "../lib/authApi";
import SiteFooter from "../components/SiteFooter";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getUser();

      if (!mounted) return;

      if (data?.user) {
        setEmail(data.user.email || "");
        setStatus("ready");
      } else {
        setStatus("error");
        setMessage("This reset link is invalid or expired. Please request a new password reset email.");
      }
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setEmail(session.user.email || "");
        setStatus("ready");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (password !== passwordAgain) {
      setStatus("ready");
      setMessage("The two passwords do not match.");
      return;
    }

    try {
      setStatus("loading");

      await updatePasswordSecurely({
        password,
        email
      });

      setStatus("success");
      setMessage("Your password has been updated. You can now sign in.");
    } catch (error) {
      setStatus("ready");
      setMessage(error.message || "Could not update password.");
    }
  }

  return (
    <>
    <main className="revision-pro-shell auth-page">
      <section className="revision-glass-card auth-card">
        <p className="eyebrow">Password Reset</p>
        <h1>Choose a new password</h1>
        <p className="muted">Use a strong password that you do not use on other websites.</p>

        {status === "checking" ? (
          <p className="status-text">Checking reset link...</p>
        ) : status === "error" ? (
          <div className="auth-form">
            <p className="error-text">{message}</p>
            <a className="revision-btn revision-btn-primary" href="/forgot-password">
              Request a new reset link
            </a>
          </div>
        ) : status === "success" ? (
          <div className="auth-form">
            <p className="status-text">{message}</p>
            <a className="revision-btn revision-btn-primary" href="/">
              Continue to ForgeNotes
            </a>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-block">
              <span>New password</span>
              <input
                type="password"
                value={password}
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <PasswordStrengthMeter password={password} email={email} />

            <label className="field-block">
              <span>Confirm new password</span>
              <input
                type="password"
                value={passwordAgain}
                autoComplete="new-password"
                onChange={(event) => setPasswordAgain(event.target.value)}
                required
              />
            </label>

            {message && (
              <p className={message.includes("not match") || message.includes("Could not") || message.includes("invalid") ? "error-text" : "status-text"}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="revision-btn revision-btn-primary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
