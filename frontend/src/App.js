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

const LAST_SUBJECT_KEY_PREFIX = "revision-app:last-subject-id";
const LAST_SUBJECT_GLOBAL_KEY = `${LAST_SUBJECT_KEY_PREFIX}:last-opened`;

function getLastSubjectKey(userId) {
  return userId ? `${LAST_SUBJECT_KEY_PREFIX}:${userId}` : LAST_SUBJECT_GLOBAL_KEY;
}

function getHashParams() {
  try {
    return new URLSearchParams(window.location.hash.replace(/^#/, ""));
  } catch (urlError) {
    return new URLSearchParams();
  }
}

function getSubjectIdFromUrl() {
  return getHashParams().get("subject") || "";
}

function writeSubjectIdToUrl(subjectId) {
  try {
    const params = getHashParams();

    if (subjectId) {
      params.set("subject", subjectId);
    } else {
      params.delete("subject");
      params.delete("topic");
      params.delete("tab");
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${window.location.search}${query ? `#${query}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  } catch (urlError) {
    // URL state is only a backup. The app still works without it.
  }
}

function getStoredSubjectId(userId) {
  try {
    const urlSubjectId = getSubjectIdFromUrl();
    if (urlSubjectId) return urlSubjectId;

    const userSubjectId = userId ? localStorage.getItem(getLastSubjectKey(userId)) : "";
    if (userSubjectId) return userSubjectId;

    return localStorage.getItem(LAST_SUBJECT_GLOBAL_KEY) || "";
  } catch (storageError) {
    return getSubjectIdFromUrl();
  }
}

function storeSubjectId(userId, subjectId) {
  try {
    const userKey = getLastSubjectKey(userId);

    if (subjectId) {
      localStorage.setItem(userKey, subjectId);
      localStorage.setItem(LAST_SUBJECT_GLOBAL_KEY, subjectId);
    } else {
      localStorage.removeItem(userKey);
      localStorage.removeItem(LAST_SUBJECT_GLOBAL_KEY);
    }
  } catch (storageError) {
    // Local storage can be blocked. The URL hash is still used as a backup.
  }

  writeSubjectIdToUrl(subjectId);
}

function clearStoredSubjectIds() {
  try {
    Object.keys(localStorage)
      .filter((key) => key === LAST_SUBJECT_KEY_PREFIX || key.startsWith(`${LAST_SUBJECT_KEY_PREFIX}:`))
      .forEach((key) => localStorage.removeItem(key));
  } catch (storageError) {
    // Local storage can be blocked. The app still works without it.
  }

  writeSubjectIdToUrl("");
}

function hasSubject(subjects, subjectId) {
  return Boolean(subjectId && subjects.some((subject) => subject.subjectId === subjectId));
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => getStoredSubjectId() || null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [hasLoadedSubjects, setHasLoadedSubjects] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = currentUser?.id || null;
  const selectedSubject = subjects.find((subject) => subject.subjectId === selectedSubjectId);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const savedUser = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(savedUser);
          setSelectedSubjectId(getStoredSubjectId(savedUser?.id) || null);
        }
      } catch (sessionError) {
        if (isMounted) setError(sessionError.message);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    }

    checkSession();

    const unsubscribe = onAuthStateChange((user, event) => {
      // Important: Supabase may briefly emit an auth event with no user when a tab
      // sleeps/wakes or refocuses. That is not the same as the user pressing Log out.
      // Do not clear the selected subject unless the event is a real SIGNED_OUT event.
      if (event === "SIGNED_OUT") {
        clearStoredSubjectIds();
        setCurrentUser(null);
        setSubjects([]);
        setSelectedSubjectId(null);
        setHasLoadedSubjects(false);
        return;
      }

      if (!user) {
        return;
      }

      setCurrentUser((previousUser) => {
        const previousUserId = previousUser?.id || null;
        const nextUserId = user.id || null;

        if (previousUserId === nextUserId) {
          return previousUser;
        }

        setHasLoadedSubjects(false);
        setSelectedSubjectId(getStoredSubjectId(nextUserId) || null);
        return user;
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function loadSubjects() {
    if (!currentUserId) return;

    setIsLoadingSubjects(true);
    setError("");

    try {
      const loadedSubjects = await fetchSubjects();
      setSubjects(loadedSubjects);
      setSelectedSubjectId((currentSelectedId) => {
        if (hasSubject(loadedSubjects, currentSelectedId)) {
          storeSubjectId(currentUserId, currentSelectedId);
          return currentSelectedId;
        }

        const storedSubjectId = getStoredSubjectId(currentUserId);
        if (hasSubject(loadedSubjects, storedSubjectId)) {
          storeSubjectId(currentUserId, storedSubjectId);
          return storedSubjectId;
        }

        storeSubjectId(currentUserId, "");
        return null;
      });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingSubjects(false);
      setHasLoadedSubjects(true);
    }
  }

  useEffect(() => {
    if (!currentUserId) return;

    setHasLoadedSubjects(false);
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    function restoreOpenSubjectAfterTabFocus() {
      if (!currentUserId) return;

      const storedSubjectId = getStoredSubjectId(currentUserId);
      if (hasSubject(subjects, storedSubjectId)) {
        setSelectedSubjectId(storedSubjectId);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        restoreOpenSubjectAfterTabFocus();
      }
    }

    window.addEventListener("focus", restoreOpenSubjectAfterTabFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", restoreOpenSubjectAfterTabFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUserId, subjects]);

  function handleLogin(user) {
    setCurrentUser(user);
    setHasLoadedSubjects(false);
    setSelectedSubjectId(getStoredSubjectId(user?.id) || null);
  }

  async function handleLogout() {
    try {
      await clearSession();
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      clearStoredSubjectIds();
      setCurrentUser(null);
      setSubjects([]);
      setSelectedSubjectId(null);
      setHasLoadedSubjects(false);
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
    storeSubjectId(currentUserId, newSubject.subjectId);

    try {
      const savedSubjects = await createSubject(newSubject);
      setSubjects(savedSubjects);
    } catch (saveError) {
      setError(saveError.message);
      setSubjects(previousSubjects);
      storeSubjectId(currentUserId, "");
      setSelectedSubjectId(null);
    }
  }

  async function handleDeleteSubject(subjectId) {
    const previousSubjects = subjects;

    setSubjects((currentSubjects) => currentSubjects.filter((subject) => subject.subjectId !== subjectId));
    if (selectedSubjectId === subjectId) {
      storeSubjectId(currentUserId, "");
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
      storeSubjectId(currentUserId, "");
      setSelectedSubjectId(null);
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  function handleSelectSubject(subject) {
    setSelectedSubjectId(subject.subjectId);
    storeSubjectId(currentUserId, subject.subjectId);
  }

  function handleBackToDashboard() {
    storeSubjectId(currentUserId, "");
    setSelectedSubjectId(null);
  }

  if (isCheckingAuth) {
    return <main className="container py-5">Checking your login...</main>;
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (isLoadingSubjects || !hasLoadedSubjects) {
    return <main className="container py-5">Loading your revision data...</main>;
  }

  return (
    <>
      <header className="app-header border-bottom">
        <div className="container d-flex justify-content-between align-items-center py-3">
          <div>
            <h1 className="h3 mb-0">Revision App</h1>
            <p className="text-muted mb-0">Flashcards, tests, notes, and glossary.</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main>
        {error && <div className="container pt-3"><div className="alert alert-danger">{error}</div></div>}
        {selectedSubject ? (
          <SubjectPage
            subject={selectedSubject}
            onBack={handleBackToDashboard}
            onUpdateSubject={updateSubject}
          />
        ) : (
          <Dashboard
            subjects={subjects}
            onSelectSubject={handleSelectSubject}
            onAddSubject={addSubject}
            onDeleteSubject={handleDeleteSubject}
            onClearAllSubjects={clearAllSubjects}
          />
        )}
      </main>
    </>
  );
}

export default App;
