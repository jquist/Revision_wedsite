import React from "react";
import { getSubjectStats } from "../utils/revisionHelpers";

function SubjectCard({ subject, onSelectSubject }) {
  const stats = getSubjectStats(subject);

  return (
    <div className="card shadow-sm h-100 subject-card">
      <div className="card-body d-flex flex-column">
        <h3 className="card-title">{subject.subjectName}</h3>

        <p className="card-text text-muted">{subject.description}</p>

        <div className="small text-muted mb-3">
          <div>{stats.totalTopics} topic(s)</div>
          <div>{stats.totalFlashcards} flashcard(s)</div>
          <div>{stats.totalQuestions} quiz question(s)</div>
          <div>
            Progress: {stats.correctCount} right / {stats.incorrectCount} wrong
          </div>
        </div>

        <button
          className="btn btn-primary mt-auto"
          onClick={() => onSelectSubject(subject)}
        >
          Open Subject
        </button>
      </div>
    </div>
  );
}

export default SubjectCard;
