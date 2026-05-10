import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import SubjectPage from "./pages/SubjectPage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [selectedSubject, setSelectedSubject] = useState(null);

  return (
    <>
      {selectedSubject ? (
        <SubjectPage
          subject={selectedSubject}
          onBack={() => setSelectedSubject(null)}
        />
      ) : (
        <Dashboard onSelectSubject={setSelectedSubject} />
      )}
    </>
  );
}

export default App;