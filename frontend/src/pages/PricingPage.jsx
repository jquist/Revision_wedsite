import React from "react";
import BetaInterestForm from "../components/BetaInterestForm";
import SiteFooter from "../components/SiteFooter";

const SUPPORT_EMAIL = "griffingroveproductions@gmail.com";

function PlanCard({ badge, title, price, description, features, highlighted }) {
  return (
    <article className={`pricing-card h-100 ${highlighted ? "pricing-card-highlighted" : ""}`}>
      {badge && <span className="pricing-badge">{badge}</span>}
      <h2 className="h4 mb-2">{title}</h2>
      <p className="pricing-price mb-2">{price}</p>
      <p className="text-muted">{description}</p>
      <ul className="pricing-feature-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {highlighted ? (
        <a className="btn btn-success rounded-pill px-4 mt-auto" href="#interest">
          Join beta interest list
        </a>
      ) : (
        <button className="btn btn-outline-secondary rounded-pill px-4 mt-auto" type="button" disabled>
          Coming later
        </button>
      )}
    </article>
  );
}

function PricingPage({ currentUser }) {
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
                <div className="landing-pill mb-3">No-payment beta plan</div>
                <h1 className="display-4 fw-bold landing-title mb-3">
                  Test demand before connecting Stripe, PayPal, or a business bank account.
                </h1>
                <p className="lead text-muted mb-4">
                  ForgeNotes can show pricing and collect interest without taking real payments. This keeps the site professional while you find out whether people would actually use it.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <a className="btn btn-success btn-lg rounded-pill px-4" href="#interest">
                    Register interest
                  </a>
                  <a className="btn btn-light btn-lg rounded-pill px-4 shadow-sm" href="/#mode=demo">
                    Try the demo
                  </a>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="pricing-safety-card">
                  <span className="pricing-badge">Safe launch mode</span>
                  <h2 className="h4 mt-3">What is not connected yet</h2>
                  <ul className="pricing-feature-list mb-0">
                    <li>No live Stripe payments</li>
                    <li>No PayPal checkout</li>
                    <li>No bank account connection</li>
                    <li>No subscription billing</li>
                    <li>No loans, overdrafts, or credit products</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5" id="plans">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Pricing placeholder</h2>
            <p className="text-muted mb-0">
              These cards explain the future direction, but only the beta interest form is active.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <PlanCard
                badge="Active now"
                title="Free beta"
                price="£0"
                description="Best while ForgeNotes is still being tested and improved."
                features={[
                  "Use the current study tools",
                  "Try demo content first",
                  "Give feedback before pricing is final",
                  "No card details needed",
                ]}
                highlighted
              />
            </div>
            <div className="col-md-4">
              <PlanCard
                badge="Coming soon"
                title="Student plan"
                price="Price not set"
                description="A possible low-cost plan if enough people want continued access."
                features={[
                  "Subject and topic limits can be added later",
                  "AI import access can be controlled later",
                  "Stripe test mode can be built before launch",
                  "Cancel/subscription pages can be added later",
                ]}
              />
            </div>
            <div className="col-md-4">
              <PlanCard
                badge="Future idea"
                title="Class / group plan"
                price="Not available yet"
                description="A later option for tutors, classrooms, or small study groups."
                features={[
                  "Multiple users",
                  "Shared subjects",
                  "Viewer/editor/copy sharing model",
                  "Admin oversight options",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="container pb-5">
          <div className="revision-glass-card pricing-explainer-card">
            <div>
              <p className="eyebrow">Why this setup</p>
              <h2 className="h4">You can validate the idea without a business commitment.</h2>
              <p className="text-muted mb-0">
                The website can look ready for paid plans while only saving interest responses. When there is real demand, you can connect Stripe in test mode first, then decide whether a separate account is worth it.
              </p>
            </div>
            <a className="btn btn-outline-primary rounded-pill px-4" href={`mailto:${SUPPORT_EMAIL}`}>
              Email feedback
            </a>
          </div>
        </section>

        <section className="container pb-5" id="interest">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="revision-glass-card pricing-interest-card">
                <p className="eyebrow">Beta interest</p>
                <h2 className="h3">Tell us if you would use ForgeNotes</h2>
                <p className="text-muted">
                  This form only records interest. It does not collect card details and does not start a subscription.
                </p>
                <BetaInterestForm currentUser={currentUser} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default PricingPage;
