import React, { useState } from "react";

function NewSubjectCard({ showForm, onShowForm, onCancel, onAddSubject }) {
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!subjectName.trim()) {
      return;
    }

    onAddSubject({
      subjectName: subjectName.trim(),
      description: description.trim(),
    });

    setSubjectName("");
    setDescription("");
  }

  if (!showForm) {
    return (
      <button
        className="card shadow-sm h-100 subject-card new-subject-button text-start"
        onClick={onShowForm}
      >
        <div className="card-body d-flex flex-column justify-content-center align-items-center text-center">
          <div className="new-subject-plus">+</div>
          <h3 className="card-title">New Subject</h3>
          <p className="text-muted mb-0">
            Add another subject or module.
          </p>
        </div>
      </button>
    );
  }

  return (
    <form className="card shadow-sm h-100 subject-card" onSubmit={handleSubmit}>
      <div className="card-body d-flex flex-column">
        <h3 className="card-title">New Subject</h3>

        <div className="mb-2">
          <label className="form-label">Subject name</label>
          <input
            className="form-control"
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder="Example: Databases"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows="3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this subject for?"
          />
        </div>

        <div className="d-flex gap-2 mt-auto">
          <button className="btn btn-primary" type="submit">
            Create
          </button>

          <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default NewSubjectCard;
