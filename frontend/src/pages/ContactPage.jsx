import React from "react";
import SiteFooter from "../components/SiteFooter";

const SUPPORT_EMAIL = "griffingroveproductions@gmail.com";

export default function ContactPage() {
  return (
    <>
      <main className="revision-pro-shell public-page-shell">
        <section className="revision-glass-card public-page-card">
          <p className="eyebrow">Contact</p>
          <h1>Contact ForgeNotes</h1>
          <p className="muted">
            Need help with your account, password reset, revision content, or want to report a bug?
            Email us and include what you were trying to do, what went wrong, and any screenshots if useful.
          </p>

          <div className="contact-email-card mt-4">
            <span className="contact-label">Work email</span>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <p className="muted mb-0">
              This is the best place for support questions, tester feedback, and website issues.
            </p>
          </div>

          <div className="contact-grid mt-4">
            <article className="contact-card">
              <h2 className="h5">Account help</h2>
              <p className="muted mb-0">
                For login issues, verification emails, or password reset problems, include the email address
                you used to create your account.
              </p>
            </article>

            <article className="contact-card">
              <h2 className="h5">Feedback & bugs</h2>
              <p className="muted mb-0">
                Send feature ideas, confusing sections, broken buttons, or anything that made studying harder.
              </p>
            </article>

            <article className="contact-card">
              <h2 className="h5">Account safety</h2>
              <p className="muted mb-0">
                Password reset uses a dedicated recovery page and account settings stay inside the logged-in top bar.
              </p>
            </article>
          </div>

          <div className="button-row mt-4">
            <a className="btn btn-success" href={`mailto:${SUPPORT_EMAIL}`}>
              Email support
            </a>
            <a className="btn btn-outline-secondary" href="/">
              Back home
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
