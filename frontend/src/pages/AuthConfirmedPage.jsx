import React from "react";
import SiteFooter from "../components/SiteFooter";

export default function AuthConfirmedPage() {
  return (
    <>
    <main className="revision-pro-shell auth-page">
      <section className="revision-glass-card auth-card">
        <p className="eyebrow">Email Verified</p>
        <h1>Your email is confirmed</h1>
        <p className="muted">
          Your account is ready. You can now sign in and continue revising.
        </p>

        <a className="revision-btn revision-btn-primary" href="/">
          Continue
        </a>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
