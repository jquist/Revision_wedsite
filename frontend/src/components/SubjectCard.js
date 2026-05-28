import React from "react";
import { getSubjectStats } from "../utils/revisionHelpers";

function SubjectCard({ subject, onSelectSubject, onDeleteSubject }) {
  const stats = getSubjectStats(subject);
  const sharing = subject?._sharing || {};
  const isShared = sharing.isOwner === false;
  const roleLabel = sharing.role === "editor" ? "Editor" : sharing.role === "viewer" ? "Viewer" : "Owner";

  return (
    <div className="card shadow-sm revision-card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h2 className="h5 mb-0">{subject.subjectName}</h2>
          {isShared && <span className="badge rounded-pill text-bg-info">Shared · {roleLabel}</span>}
        </div>
        {isShared && (
          <p className="small text-muted mb-2">
            Shared by {sharing.ownerName || sharing.ownerEmail || "another user"}
          </p>
        )}
        <p className="text-muted flex-grow-1">{subject.description}</p>
        <div className="small text-muted mb-3">
          {stats.totalTopics} topic(s) · {stats.totalFlashcards} flashcard(s) · {stats.totalQuestions} question(s)
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => onSelectSubject(subject)}>
            Open
          </button>
          <a className="btn btn-outline-primary" href="/friends">
            Share
          </a>
          <button className="btn btn-outline-danger" onClick={() => onDeleteSubject(subject)}>
            {isShared ? "Leave" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;
