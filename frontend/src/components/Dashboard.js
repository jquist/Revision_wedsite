import React, { useState } from "react";
import SubjectCard from "./SubjectCard";
import NewSubjectCard from "./NewSubjectCard";

function Dashboard({ subjects, currentUser, onLogout, onSelectSubject, onAddSubject, onDeleteSubject, onClearAllSubjects }) {
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="mb-2">Revision Dashboard</h1>
          <p className="text-muted mb-0">
            Create subjects, add flashcards, practise them, and keep your progress
            saved to your Supabase account.
          </p>
        </div>

        <div className="text-end">
          <div className="small text-muted mb-2">
            Logged in as <strong>{currentUser.email || currentUser.username}</strong>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={onLogout}>
              Log out
            </button>

            <button className="btn btn-outline-danger" onClick={onClearAllSubjects}>
              Clear my subjects
            </button>
          </div>
        </div>
      </div>

      {subjects.length === 0 && (
        <div className="alert alert-light border">
          You do not have any subjects yet. Use the new subject card to create your first one.
        </div>
      )}

      <div className="row g-3">
        {subjects.map((subject) => (
          <div className="col-md-4" key={subject.subjectId}>
            <SubjectCard
              subject={subject}
              onSelectSubject={onSelectSubject}
              onDeleteSubject={onDeleteSubject}
            />
          </div>
        ))}

        <div className="col-md-4">
          <NewSubjectCard
            showForm={showNewSubjectForm}
            onShowForm={() => setShowNewSubjectForm(true)}
            onCancel={() => setShowNewSubjectForm(false)}
            onAddSubject={(newSubject) => {
              onAddSubject(newSubject);
              setShowNewSubjectForm(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
