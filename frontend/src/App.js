import React, { useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import SubjectPage from "./pages/SubjectPage";
import { createBlankSubject } from "./utils/revisionHelpers";
import {
  clearSession,
  createSubject,
  deleteSubject,
  fetchSubjects,
  getCurrentUser,
  onAuthStateChange,
  saveAllSubjects,
  saveSubject,
} from "./utils/api";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [error, setError] = useState("");

  const selectedSubject = subjects.find(
    (subject) => subject.subjectId === selectedSubjectId
  );

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const savedUser = await getCurrentUser();

        if (isMounted) {
          setCurrentUser(savedUser);
        }
      } catch (sessionError) {
        if (isMounted) {
          setError(sessionError.message);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkSession();

    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setSelectedSubjectId(null);

      if (!user) {
        setSubjects([]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  async function handleLogout() {
    try {
      await clearSession();
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      setCurrentUser(null);
      setSubjects([]);
      setSelectedSubjectId(null);
    }
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

  async function handleDeleteSubject(subjectId) {
    const previousSubjects = subjects;

    setSubjects((currentSubjects) =>
      currentSubjects.filter((subject) => subject.subjectId !== subjectId)
    );

    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
    }

    try {
      const savedSubjects = await deleteSubject(subjectId);
      setSubjects(savedSubjects);
    } catch (deleteError) {
      setError(deleteError.message);
      setSubjects(previousSubjects);
    }
  }

  async function clearAllSubjects() {
    try {
      const savedSubjects = await saveAllSubjects([]);
      setSubjects(savedSubjects);
      setSelectedSubjectId(null);
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">Checking your login...</div>
      </div>
    );
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
          onDeleteSubject={handleDeleteSubject}
          onClearAllSubjects={clearAllSubjects}
        />
      )}
    </>
  );
}

export default App;
