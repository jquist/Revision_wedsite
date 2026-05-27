import React, { useState } from "react";
import SiteFooter from "../components/SiteFooter";
import { requestPasswordReset } from "../lib/authApi";

export default function SettingsPage({ currentUser, onLogout }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSendResetEmail() {
    setMessage("");

    if (!currentUser?.email) {
      setStatus("error");
      setMessage("Could not find your account email.");
      return;
    }

    try {
      setStatus("loading");
      await requestPasswordReset(currentUser.email);
      setStatus("success");
      setMessage("Password reset email sent. Use the link in your email to choose a new password.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not send password reset email.");
    }
  }

  return (
    <>
      <main className="revision-pro-shell settings-shell">
        <div className="revision-page-container settings-layout">
          <section className="revision-glass-card settings-hero-card">
            <div>
              <p className="eyebrow">Settings</p>
              <h1>Account & settings</h1>
              <p className="muted mb-0">
                Manage your account details and security from one safe place.
              </p>
            </div>
            <div className="button-row">
              <a className="btn btn-outline-secondary" href="/">
                Back to app
              </a>
              <button className="btn btn-outline-danger" type="button" onClick={onLogout}>
                Log out
              </button>
            </div>
          </section>

          <section className="revision-glass-card settings-card">
            <h2 className="h4">Account</h2>
            <p className="muted mb-2">Signed in as:</p>
            <p className="settings-email mb-0">{currentUser?.email || "Unknown email"}</p>
          </section>

          <section className="revision-glass-card settings-card">
            <h2 className="h4">Security</h2>
            <p className="muted">
              To change your password, ForgeNotes sends a secure recovery link to your email.
              The recovery link opens the dedicated reset password page, not another user account page.
            </p>
            <button
              className="btn btn-success"
              type="button"
              onClick={handleSendResetEmail}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send password reset email"}
            </button>
            {message && (
              <p className={status === "error" ? "error-text mt-3 mb-0" : "status-text mt-3 mb-0"}>
                {message}
              </p>
            )}
          </section>

          <section className="revision-glass-card settings-card">
            <h2 className="h4">Data</h2>
            <p className="muted mb-0">
              Your subjects are saved to your own logged-in account. Database security rules should keep
              each user restricted to their own rows.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
