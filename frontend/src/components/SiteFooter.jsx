import React from "react";

const SUPPORT_EMAIL = "griffingroveproductions@gmail.com";

export default function SiteFooter({ showContact = true } = {}) {
  return (
    <footer className="site-footer">
      <div className="container py-4">
        <div className="footer-grid">
          <div>
            <div className="brand-mark d-flex align-items-center gap-2 mb-2">
              <span className="brand-icon brand-icon-small">FN</span>
              <span className="fw-bold">ForgeNotes</span>
            </div>
            <p className="text-muted mb-2">
              A study space for flashcards, tests, notes, and AI-assisted topic building.
            </p>
            <p className="footer-small mb-0">
              Made by Griffin Grove Productions.
            </p>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <strong>Website</strong>
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/contact">Contact</a>
            <a href="/forgot-password">Reset password</a>
          </nav>

          <div className="footer-contact">
            <strong>{showContact ? "Contact" : "Support"}</strong>
            {showContact ? (
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            ) : (
              <a href="/contact">Contact page</a>
            )}
            <span>For support, feedback, bugs, or account help.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
