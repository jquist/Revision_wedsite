import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import SubjectPage from "./pages/SubjectPage";
import { subjectManifest } from "./data/subjectManifest";
import { createBlankSubject } from "./utils/revisionHelpers";

const STORAGE_KEY = "revision-app-subjects";

function App() {
  const [subjects, setSubjects] = useState(() => {
    const savedSubjects = localStorage.getItem(STORAGE_KEY);

    if (savedSubjects) {
      try {
        return JSON.parse(savedSubjects);
      } catch {
        return subjectManifest;
      }
    }

    return subjectManifest;
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  const selectedSubject = subjects.find(
    (subject) => subject.subjectId === selectedSubjectId
  );

  function updateSubject(updatedSubject) {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.subjectId === updatedSubject.subjectId ? updatedSubject : subject
      )
    );
  }

  function addSubject(newSubjectData) {
    const newSubject = createBlankSubject(newSubjectData);
    setSubjects((currentSubjects) => [...currentSubjects, newSubject]);
    setSelectedSubjectId(newSubject.subjectId);
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    setSubjects(subjectManifest);
    setSelectedSubjectId(null);
  }

  return (
    <>
      {selectedSubject ? (
        <SubjectPage
          subject={selectedSubject}
          onBack={() => setSelectedSubjectId(null)}
          onUpdateSubject={updateSubject}
        />
      ) : (
        <Dashboard
          subjects={subjects}
          onSelectSubject={(subject) => setSelectedSubjectId(subject.subjectId)}
          onAddSubject={addSubject}
          onResetDemoData={resetDemoData}
        />
      )}
    </>
  );
}

export default App;
