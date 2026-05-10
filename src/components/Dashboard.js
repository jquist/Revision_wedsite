import React, { useState } from "react";
import SubjectCard from "./SubjectCard";
import NewSubjectCard from "./NewSubjectCard";

function Dashboard({ subjects, onSelectSubject, onAddSubject, onResetDemoData }) {
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

        <button className="btn btn-outline-danger" onClick={onResetDemoData}>
          Reset demo data
        </button>
      </div>

      <div className="row g-3">
        {subjects.map((subject) => (
          <div className="col-md-4" key={subject.subjectId}>
            <SubjectCard
              subject={subject}
              onSelectSubject={onSelectSubject}
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
