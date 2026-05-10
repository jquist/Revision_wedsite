import React from "react";
import SubjectCard from "./SubjectCard";
import { subjectManifest } from "../data/subjectManifest";

function Dashboard({ onSelectSubject }) {
  return (
    <div className="container py-4">
      <h1 className="mb-3">Revision Dashboard</h1>

      <p className="text-muted">
        Each subject is loaded from its own JSON file. Later, each user can have
        several subject files.
      </p>

      <div className="row g-3">
        {subjectManifest.map((subject) => (
          <div className="col-md-4" key={subject.subjectId}>
            <SubjectCard
              subject={subject}
              onSelectSubject={onSelectSubject}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;