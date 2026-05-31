import React, { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import { requestPasswordReset } from "../lib/authApi";
import { fetchCurrentProfile, updateCurrentProfile } from "../utils/api";

export default function SettingsPage({ currentUser, onLogout }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileMessage, setProfileMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const profile = await fetchCurrentProfile();
        if (!isMounted) return;
        setDisplayName(profile?.display_name || "");
        setUsername(profile?.username || "");
      } catch (error) {
        if (!isMounted) return;
        setProfileStatus("error");
        setProfileMessage(error.message || "Could not load your profile.");
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveProfile(event) {
    event.preventDefault();
    setProfileMessage("");

    try {
      setProfileStatus("loading");
      const profile = await updateCurrentProfile({ username, displayName });
      setDisplayName(profile?.display_name || "");
      setUsername(profile?.username || "");
      setProfileStatus("success");
      setProfileMessage("Profile saved. Friends can now find you by username.");
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(error.message || "Could not save your profile.");
    }
  }

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
              <h1>Account settings</h1>
              <p className="muted mb-0">
                Manage your profile, username, password reset, and sign-out options from one safe place.
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
            <p className="settings-email mb-4">{currentUser?.email || "Unknown email"}</p>

            <form onSubmit={handleSaveProfile}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="display-name">Display name</label>
                  <input
                    id="display-name"
                    className="form-control"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your study name"
                    maxLength={60}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="username">Username</label>
                  <div className="input-group">
                    <span className="input-group-text">@</span>
                    <input
                      id="username"
                      className="form-control"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value.toLowerCase())}
                      placeholder="studyfriend"
                      minLength={3}
                      maxLength={24}
                      pattern="[a-z0-9_]{3,24}"
                      required
                    />
                  </div>
                  <p className="small text-muted mt-1 mb-0">
                    Use 3-24 lowercase letters, numbers, or underscores. Friends can search this to add/share with you.
                  </p>
                </div>
              </div>
              <button className="btn btn-primary mt-3" type="submit" disabled={profileStatus === "loading"}>
                {profileStatus === "loading" ? "Saving..." : "Save profile"}
              </button>
              {profileMessage && (
                <p className={profileStatus === "error" ? "error-text mt-3 mb-0" : "status-text mt-3 mb-0"}>
                  {profileMessage}
                </p>
              )}
            </form>
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
            <h2 className="h4">Sharing</h2>
            <p className="muted mb-0">
              Viewer and editor shares are live links to the owner&apos;s subject. Own copy gives your friend a separate duplicate, so their edits do not change your version.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
