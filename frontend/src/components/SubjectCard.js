import React from "react";
import { getSubjectStats } from "../utils/revisionHelpers";

function SubjectCard({ subject, onSelectSubject, onDeleteSubject }) {
  const stats = getSubjectStats(subject);

  return (
    <div className="card shadow-sm revision-card h-100">
      <div className="card-body d-flex flex-column">
        <h2 className="h5">{subject.subjectName}</h2>
        <p className="text-muted flex-grow-1">{subject.description}</p>
        <div className="small text-muted mb-3">
          {stats.totalTopics} topic(s) · {stats.totalFlashcards} flashcard(s) · {stats.totalQuestions} question(s)
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => onSelectSubject(subject)}>
            Open
          </button>
          <button className="btn btn-outline-danger" onClick={() => onDeleteSubject(subject.subjectId)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;
