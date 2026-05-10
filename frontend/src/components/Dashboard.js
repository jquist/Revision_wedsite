import React, { useState } from "react";
import SubjectCard from "./SubjectCard";
import NewSubjectCard from "./NewSubjectCard";

function Dashboard({ subjects, currentUser, onLogout, onSelectSubject, onAddSubject, onDeleteSubject, onResetDemoData }) {
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="mb-2">Revision Dashboard</h1>
          <p className="text-muted mb-0">
            Each subject is loaded from its own JSON-style data. You can also make
            new subjects and they save in localStorage.
          </p>
        </div>

        <div className="text-end">
          <div className="small text-muted mb-2">
            Logged in as <strong>{currentUser.username}</strong>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={onLogout}>
              Log out
            </button>

            <button className="btn btn-outline-danger" onClick={onResetDemoData}>
              Clear my subjects
            </button>
          </div>
        </div>
      </div>

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
