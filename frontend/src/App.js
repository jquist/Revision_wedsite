import React, { useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import SubjectPage from "./pages/SubjectPage";
import { createBlankSubject } from "./utils/revisionHelpers";
import {
  clearSession,
  createSubject,
  fetchSubjects,
  getSavedUser,
  saveAllSubjects,
  saveSubject,
} from "./utils/api";

function App() {
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [error, setError] = useState("");

  const selectedSubject = subjects.find(
    (subject) => subject.subjectId === selectedSubjectId
  );

  async function loadSubjects() {
    if (!currentUser) {
      return;
    }

    setIsLoadingSubjects(true);
    setError("");

    try {
      const loadedSubjects = await fetchSubjects();
      setSubjects(loadedSubjects);
    } catch (loadError) {
      setError(loadError.message);
      clearSession();
      setCurrentUser(null);
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  function handleLogin(user) {
    setCurrentUser(user);
    setSelectedSubjectId(null);
  }

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
    setSubjects([]);
    setSelectedSubjectId(null);
  }

  async function updateSubject(updatedSubject) {
    const previousSubjects = subjects;

    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.subjectId === updatedSubject.subjectId ? updatedSubject : subject
      )
    );

    try {
      const savedSubjects = await saveSubject(updatedSubject);
      setSubjects(savedSubjects);
    } catch (saveError) {
      setError(saveError.message);
      setSubjects(previousSubjects);
    }
  }

  async function addSubject(newSubjectData) {
    const newSubject = createBlankSubject(newSubjectData);
    const previousSubjects = subjects;

    setSubjects((currentSubjects) => [...currentSubjects, newSubject]);
    setSelectedSubjectId(newSubject.subjectId);

    try {
      const savedSubjects = await createSubject(newSubject);
      setSubjects(savedSubjects);
    } catch (saveError) {
      setError(saveError.message);
      setSubjects(previousSubjects);
      setSelectedSubjectId(null);
    }
  }

  async function resetDemoData() {
    try {
      const savedSubjects = await saveAllSubjects([]);
      setSubjects(savedSubjects);
      setSelectedSubjectId(null);
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (isLoadingSubjects) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">Loading your revision data...</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="container pt-3">
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      {selectedSubject ? (
        <SubjectPage
          subject={selectedSubject}
          onBack={() => setSelectedSubjectId(null)}
          onUpdateSubject={updateSubject}
        />
      ) : (
        <Dashboard
          subjects={subjects}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectSubject={(subject) => setSelectedSubjectId(subject.subjectId)}
          onAddSubject={addSubject}
          onResetDemoData={resetDemoData}
        />
      )}
    </>
  );
}

export default App;
