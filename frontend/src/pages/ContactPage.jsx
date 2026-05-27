import React from "react";
import SiteFooter from "../components/SiteFooter";

export default function ContactPage() {
  return (
    <>
      <main className="revision-pro-shell public-page-shell">
        <section className="revision-glass-card public-page-card">
          <p className="eyebrow">Contact</p>
          <h1>Contact ForgeNotes</h1>
          <p className="muted">
            This page gives the website a normal contact/help area. Add your real support email,
            university project contact, or feedback form later when you are ready.
          </p>

          <div className="contact-grid mt-4">
            <article className="contact-card">
              <h2 className="h5">Support</h2>
              <p className="muted mb-0">
                Need help with logging in, resetting your password, or using your subjects?
                Add your support email here.
              </p>
            </article>

            <article className="contact-card">
              <h2 className="h5">Feedback</h2>
              <p className="muted mb-0">
                Use this area for bug reports, feature suggestions, or comments from testers.
              </p>
            </article>

            <article className="contact-card">
              <h2 className="h5">Account safety</h2>
              <p className="muted mb-0">
                Password reset now uses a dedicated recovery page instead of opening the account area.
              </p>
            </article>
          </div>

          <div className="button-row mt-4">
            <a className="btn btn-success" href="/">
              Back home
            </a>
            <a className="btn btn-outline-secondary" href="/forgot-password">
              Reset password
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
