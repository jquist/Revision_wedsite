import React, { useState } from "react";

function NewSubjectCard({ onAddSubject }) {
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = subjectName.trim();
    if (!cleanName) return;

    onAddSubject({ subjectName: cleanName, description: description.trim() });
    setSubjectName("");
    setDescription("");
  }

  return (
    <div className="card shadow-sm revision-card h-100">
      <div className="card-body">
        <h2 className="h5">Create new subject</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="subject-name">Subject name</label>
            <input
              id="subject-name"
              className="form-control"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Ethical Hacking"
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="subject-description">Description</label>
            <textarea
              id="subject-description"
              className="form-control"
              rows="3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional subject notes"
            />
          </div>
          <button className="btn btn-success" type="submit" disabled={!subjectName.trim()}>
            Add Subject
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewSubjectCard;
