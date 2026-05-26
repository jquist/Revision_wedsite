import React from "react";

function LandingPage({ onStartAuth, onViewDemo }) {
  return (
    <main className="landing-page overflow-hidden">
      <section className="landing-hero position-relative">
        <div className="landing-blob landing-blob-one" />
        <div className="landing-blob landing-blob-two" />
        <div className="landing-blob landing-blob-three" />

        <div className="container position-relative py-5">
          <nav className="landing-nav d-flex justify-content-between align-items-center mb-5">
            <div className="brand-mark d-flex align-items-center gap-2">
              <span className="brand-icon">R</span>
              <span className="fw-bold">Revision App</span>
            </div>
            <button className="btn btn-outline-success rounded-pill px-4" onClick={onStartAuth}>
              Log in
            </button>
          </nav>

          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="landing-pill mb-3">AI-ready study space</div>
              <h1 className="display-4 fw-bold landing-title mb-3">
                Turn revision into flashcards, tests, notes, and glossary terms.
              </h1>
              <p className="lead text-muted mb-4">
                Keep each subject organised by topic, practise with score-based flashcards, and check your understanding with shuffled multiple-choice tests.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <button className="btn btn-success btn-lg rounded-pill px-4" onClick={onStartAuth}>
                  Start revising
                </button>
                <button className="btn btn-light btn-lg rounded-pill px-4 shadow-sm" onClick={onViewDemo}>
                  View demo
                </button>
              </div>
              <div className="landing-stats d-flex flex-wrap gap-3">
                <div>
                  <strong>Subjects</strong>
                  <span>separate your modules</span>
                </div>
                <div>
                  <strong>Topics</strong>
                  <span>organise each lecture</span>
                </div>
                <div>
                  <strong>Tests</strong>
                  <span>randomised answers</span>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="hero-showcase mx-auto">
                <div className="floating-card floating-card-main">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted small mb-1">Demo subject</p>
                      <h2 className="h4 mb-0">Computer Science</h2>
                    </div>
                    <span className="badge text-bg-success">Live demo</span>
                  </div>
                  <div className="demo-progress mb-3">
                    <span style={{ width: "72%" }} />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="mini-tile">4 flashcards</div>
                    </div>
                    <div className="col-6">
                      <div className="mini-tile">3 test questions</div>
                    </div>
                    <div className="col-6">
                      <div className="mini-tile">3 notes</div>
                    </div>
                    <div className="col-6">
                      <div className="mini-tile">4 glossary terms</div>
                    </div>
                  </div>
                </div>
                <div className="floating-card floating-card-question">
                  <span className="small text-muted">Flashcard</span>
                  <p className="mb-0 fw-semibold">What does MFA add to a login?</p>
                </div>
                <div className="floating-card floating-card-score">
                  <span className="score-dot" />
                  Smart score filters
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">What the website does</h2>
          <p className="text-muted mb-0">A simple place for students to store revision content and practise it actively.</p>
        </div>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="feature-card h-100">
              <div className="feature-icon">01</div>
              <h3 className="h5">Organise by subject</h3>
              <p className="text-muted mb-0">Create separate subjects for modules, exams, or personal study areas.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card h-100">
              <div className="feature-icon">02</div>
              <h3 className="h5">Practise actively</h3>
              <p className="text-muted mb-0">Use flashcards and multiple-choice tests instead of only rereading notes.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card h-100">
              <div className="feature-icon">03</div>
              <h3 className="h5">Track weak areas</h3>
              <p className="text-muted mb-0">Flashcard scores help show which cards need more practice.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
