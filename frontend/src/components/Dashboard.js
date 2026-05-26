import React from "react";
import NewSubjectCard from "./NewSubjectCard";
import SubjectCard from "./SubjectCard";

function Dashboard({ subjects, onSelectSubject, onAddSubject, onDeleteSubject, onClearAllSubjects }) {
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Your subjects</h2>
          <p className="text-muted mb-0">Open a subject to revise flashcards, tests, notes, and glossary.</p>
        </div>
        {subjects.length > 0 && (
          <button className="btn btn-outline-danger" onClick={onClearAllSubjects}>
            Clear All
          </button>
        )}
      </div>

      <div className="row g-3">
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
  );
}

export default Dashboard;
