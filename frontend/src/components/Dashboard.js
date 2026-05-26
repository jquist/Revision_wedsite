
import React from "react";
import NewSubjectCard from "./NewSubjectCard";
import SubjectCard from "./SubjectCard";

function Dashboard({ subjects, onSelectSubject, onAddSubject, onDeleteSubject, onClearAllSubjects }) {
  return (
    <div className="revision-pro-shell">
      <div className="revision-page-container">
        <div className="revision-glass-card dashboard-hero-card mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <p className="eyebrow mb-2">Workspace</p>
              <h2 className="mb-1">Your subjects</h2>
              <p className="muted mb-0">Open a subject to revise flashcards, tests, notes, glossary and AI-imported lecture content.</p>
            </div>
            {subjects.length > 0 && (
              <button className="btn btn-outline-danger" onClick={onClearAllSubjects}>
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-xl-4">
            <NewSubjectCard onAddSubject={onAddSubject} />
          </div>
          {subjects.map((subject) => (
            <div className="col-md-6 col-xl-4" key={subject.subjectId}>
              <SubjectCard
                subject={subject}
                onSelectSubject={onSelectSubject}
                onDeleteSubject={onDeleteSubject}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
