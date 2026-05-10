import React from "react";
import { getSubjectStats } from "../utils/revisionHelpers";

function SubjectCard({ subject, onSelectSubject, onDeleteSubject }) {
  const stats = getSubjectStats(subject);

  function handleDelete(event) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${subject.subjectName}"? This cannot be undone.`
    );

    if (confirmed) {
      onDeleteSubject(subject.subjectId);
    }
  }

  return (
    <div className="card shadow-sm h-100 subject-card">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="card-title">{subject.subjectName}</h3>

          {subject.isExample && (
            <span className="badge text-bg-info">Example</span>
          )}
        </div>

        <p className="card-text text-muted">{subject.description}</p>

        <div className="small text-muted mb-3">
          <div>{stats.totalTopics} topic(s)</div>
          <div>{stats.totalFlashcards} flashcard(s)</div>
          <div>{stats.totalQuestions} quiz question(s)</div>
          <div>
            Progress: {stats.correctCount} right / {stats.incorrectCount} wrong
          </div>
        </div>

        <div className="d-flex gap-2 mt-auto">
          <button
            className="btn btn-primary flex-grow-1"
            onClick={() => onSelectSubject(subject)}
          >
            Open Subject
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={handleDelete}
            title="Delete subject"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;
