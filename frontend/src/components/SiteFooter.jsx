import React from "react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <div className="brand-mark d-flex align-items-center gap-2 mb-2">
              <span className="brand-icon brand-icon-small">FN</span>
              <span className="fw-bold">ForgeNotes</span>
            </div>
            <p className="text-muted mb-0">
              A study space for flashcards, tests, notes, and AI-assisted topic building.
            </p>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <a href="/">Home</a>
            <a href="/contact">Contact</a>
            <a href="/forgot-password">Reset password</a>
            <a href="/settings">Settings</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
