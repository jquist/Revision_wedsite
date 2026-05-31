import React from "react";
import BetaInterestForm from "../components/BetaInterestForm";
import SiteFooter from "../components/SiteFooter";

const plans = [
  {
    badge: "Best for trying it out",
    title: "Free",
    price: "£0",
    cadence: "forever",
    description: "A simple way to organise one subject and test the core revision tools.",
    limits: [
      "1 subject",
      "5 study topics per subject",
      "Up to 100 flashcards",
      "Up to 5 saved practice tests",
      "Manual notes, flashcards, and questions",
    ],
    features: ["Demo content", "Basic progress tracking", "Standard account settings"],
    cta: "Start free",
    href: "/#mode=auth",
  },
  {
    badge: "Recommended",
    title: "Student",
    price: "£3.99",
    cadence: "per month",
    description: "For students who want enough space for current modules, topics, and AI-assisted revision.",
    limits: [
      "2 active subjects",
      "11 study topics per subject",
      "General / All Topics does not count towards the topic limit",
      "Up to 1,000 flashcards",
      "Up to 25 AI imports per month",
    ],
    features: ["Larger practice tests", "Flashcard games", "Viewer, editor, and own-copy sharing"],
    cta: "Choose Student",
    href: "#interest",
    highlighted: true,
  },
  {
    badge: "More room",
    title: "Pro",
    price: "£6.99",
    cadence: "per month",
    description: "For heavier revision, multiple subjects, and larger imported sets of notes.",
    limits: [
      "6 active subjects",
      "20 study topics per subject",
      "General / All Topics does not count towards the topic limit",
      "Up to 3,000 flashcards",
      "Up to 75 AI imports per month",
    ],
    features: ["Bigger AI-generated tests", "More saved study material", "Higher AI allowance"],
    cta: "Choose Pro",
    href: "#interest",
  },
  {
    badge: "Tutors & groups",
    title: "Group",
    price: "Custom",
    cadence: "for small groups",
    description: "For tutors, classes, and study groups that need shared revision spaces.",
    limits: [
      "Multiple learner accounts",
      "Shared subjects and resources",
      "Viewer / editor permissions",
      "Own-copy sharing for independent study",
      "Admin overview options",
    ],
    features: ["Useful for tutors", "Small class support", "Flexible setup"],
    cta: "Ask about Group",
    href: "#interest",
  },
];

const comparisonRows = [
  ["Active subjects", "1", "2", "6", "Custom"],
  ["Topics per subject", "5", "11", "20", "Custom"],
  ["Flashcards", "100", "1,000", "3,000", "Custom"],
  ["AI imports", "—", "25 / month", "75 / month", "Custom"],
  ["Sharing", "View own content", "Viewer, editor, own copy", "Viewer, editor, own copy", "Group permissions"],
  ["Practice tests", "5 saved", "Larger tests", "Bigger test sets", "Shared revision sets"],
];

function PlanCard({ plan }) {
  return (
    <article className={`pricing-card h-100 ${plan.highlighted ? "pricing-card-highlighted" : ""}`}>
      <div className="pricing-card-top">
        <span className="pricing-badge">{plan.badge}</span>
        <h2 className="h4 mb-1">{plan.title}</h2>
        <div className="pricing-price-wrap">
          <span className="pricing-price">{plan.price}</span>
          <span className="pricing-cadence">{plan.cadence}</span>
        </div>
        <p className="text-muted mb-0">{plan.description}</p>
      </div>

      <div>
        <h3 className="pricing-mini-title">Plan limits</h3>
        <ul className="pricing-feature-list">
          {plan.limits.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="pricing-mini-title">Included tools</h3>
        <ul className="pricing-feature-list pricing-feature-list-muted">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <a className={`btn ${plan.highlighted ? "btn-success" : "btn-outline-success"} rounded-pill px-4 mt-auto`} href={plan.href}>
        {plan.cta}
      </a>
    </article>
  );
}

function PricingPage({ currentUser }) {
  const freeHref = currentUser ? "/" : "/#mode=auth";
  const displayedPlans = plans.map((plan) => (plan.title === "Free" ? { ...plan, href: freeHref } : plan));

  return (
    <>
      <main className="pricing-page">
        <section className="pricing-hero">
          <div className="container py-4">
            <nav className="landing-nav d-flex justify-content-between align-items-center mb-5">
              <a className="brand-mark d-flex align-items-center gap-2 text-decoration-none" href="/">
                <span className="brand-icon">FN</span>
                <span className="fw-bold text-dark">ForgeNotes</span>
              </a>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <a className="btn btn-light rounded-pill px-3 shadow-sm" href="/#mode=demo">
                  View demo
                </a>
                <a className="btn btn-outline-success rounded-pill px-4" href={currentUser ? "/" : "/#mode=auth"}>
                  {currentUser ? "Open app" : "Log in"}
                </a>
              </div>
            </nav>

            <div className="row align-items-center g-5">
              <div className="col-lg-7">
                <div className="landing-pill mb-3">ForgeNotes plans</div>
                <h1 className="display-4 fw-bold landing-title mb-3">
                  Pick a revision plan that fits how much you study.
                </h1>
                <p className="lead text-muted mb-4">
                  Start free, then choose more subjects, topics, AI imports, and sharing tools when you need extra space.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <a className="btn btn-success btn-lg rounded-pill px-4" href={freeHref}>
                    Start free
                  </a>
                  <a className="btn btn-light btn-lg rounded-pill px-4 shadow-sm" href="#plans">
                    Compare plans
                  </a>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="pricing-summary-card">
                  <span className="pricing-badge">Student-friendly limits</span>
                  <h2 className="h4 mt-3">What paid plans are designed for</h2>
                  <ul className="pricing-feature-list mb-0">
                    <li>More room for separate subjects and modules</li>
                    <li>AI import allowances for turning files into revision material</li>
                    <li>Practice tests, flashcards, notes, and study games in one place</li>
                    <li>Sharing options for friends, tutors, and group revision</li>
                    <li>Simple limits so students know what each plan includes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5" id="plans">
          <div className="text-center mb-4">
            <p className="eyebrow">Pricing</p>
            <h2 className="fw-bold">Simple starting plans</h2>
            <p className="text-muted mb-0">
              Clear limits for subjects, topics, flashcards, AI imports, and sharing.
            </p>
          </div>

          <div className="row g-4">
            {displayedPlans.map((plan) => (
              <div className="col-md-6 col-xl-3" key={plan.title}>
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-5">
          <div className="revision-glass-card pricing-table-card">
            <div className="d-flex flex-wrap justify-content-between gap-3 align-items-end mb-3">
              <div>
                <p className="eyebrow">Compare limits</p>
                <h2 className="h4 mb-0">Plan comparison</h2>
              </div>
              <a className="btn btn-outline-success rounded-pill px-4" href="#interest">
                Ask about a plan
              </a>
            </div>

            <div className="table-responsive">
              <table className="table pricing-compare-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>Student</th>
                    <th>Pro</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([feature, free, student, pro, group]) => (
                    <tr key={feature}>
                      <th scope="row">{feature}</th>
                      <td>{free}</td>
                      <td>{student}</td>
                      <td>{pro}</td>
                      <td>{group}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="container pb-5" id="interest">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="revision-glass-card pricing-interest-card">
                <p className="eyebrow">Plan interest</p>
                <h2 className="h3">Get updates about ForgeNotes plans</h2>
                <p className="text-muted">
                  Pick the plan you are most interested in and leave your email for launch updates.
                </p>
                <BetaInterestForm currentUser={currentUser} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter showContact={false} />
    </>
  );
}

export default PricingPage;
