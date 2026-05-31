import React, { useEffect, useState } from "react";
import { submitBetaInterest } from "../utils/api";

const initialForm = {
  name: "",
  email: "",
  role: "student",
  subjects: "",
  wantedPlan: "free-beta",
  notes: "",
};

function BetaInterestForm({ currentUser }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    email: currentUser?.email || "",
  }));
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentUser?.email) return;
    setForm((currentForm) => ({
      ...currentForm,
      email: currentForm.email || currentUser.email,
    }));
  }, [currentUser?.email]);

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      await submitBetaInterest(form);
      setStatus("success");
      setMessage("Saved! This records interest only — no payment, subscription, or business account is connected.");
      setForm((currentForm) => ({
        ...initialForm,
        email: currentForm.email,
      }));
    } catch (submitError) {
      setStatus("error");
      setMessage(
        submitError.message ||
        "Could not save the form. You can still email griffingroveproductions@gmail.com."
      );
    }
  }

  return (
    <form className="beta-interest-form" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="beta-name">Name</label>
          <input
            id="beta-name"
            className="form-control"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label" htmlFor="beta-email">Email</label>
          <input
            id="beta-email"
            className="form-control"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label" htmlFor="beta-role">I am a</label>
          <select
            id="beta-role"
            className="form-select"
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher / tutor</option>
            <option value="parent">Parent / carer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label" htmlFor="beta-plan">Interest level</label>
          <select
            id="beta-plan"
            className="form-select"
            value={form.wantedPlan}
            onChange={(event) => updateField("wantedPlan", event.target.value)}
          >
            <option value="free-beta">I want to try the free beta</option>
            <option value="student-paid">I might pay for a low-cost student plan</option>
            <option value="class-group">I want a class / group option</option>
            <option value="feedback-only">I only want updates / feedback access</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="beta-subjects">Subjects you would use it for</label>
          <input
            id="beta-subjects"
            className="form-control"
            type="text"
            value={form.subjects}
            onChange={(event) => updateField("subjects", event.target.value)}
            placeholder="e.g. Computer Science, Biology, A-level Maths"
          />
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="beta-notes">What would make ForgeNotes worth using?</label>
          <textarea
            id="beta-notes"
            className="form-control"
            rows="4"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Optional feedback, feature requests, or pricing thoughts"
          />
        </div>
      </div>

      {message && (
        <div className={`alert mt-3 mb-0 ${status === "success" ? "alert-success" : "alert-warning"}`}>
          {message}
        </div>
      )}

      <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
        <button className="btn btn-success rounded-pill px-4" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Register interest"}
        </button>
        <span className="small text-muted">No card details. No payment account. No subscription started.</span>
      </div>
    </form>
  );
}

export default BetaInterestForm;
