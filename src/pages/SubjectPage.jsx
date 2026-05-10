import React, { useState } from "react";
import TopicSelector from "../components/TopicSelector";
import FlashcardPractice from "../components/FlashcardPractice";
import PracticeTest from "../components/PracticeTest";
import RevisionNotes from "../components/RevisionNotes";
import Glossary from "../components/Glossary";
import { findTopicById, updateFlashcardProgress } from "../utils/revisionHelpers";

function SubjectPage({ subject, onBack }) {
  const [localSubject, setLocalSubject] = useState(subject);
  const [selectedTopicId, setSelectedTopicId] = useState(subject.topics[0].topicId);
  const [activeTab, setActiveTab] = useState("flashcards");

  const selectedTopic = findTopicById(localSubject, selectedTopicId);

  function handleMarkFlashcard(topicId, flashcardId, wasCorrect) {
    const updatedSubject = updateFlashcardProgress(
      localSubject,
      topicId,
      flashcardId,
      wasCorrect
    );

    setLocalSubject(updatedSubject);

    // Later this is where you would save to backend/localStorage.
    console.log("Updated subject:", updatedSubject);
  }

  return (
    <div className="container py-4">
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        Back
      </button>

      <h1>{localSubject.subjectName}</h1>
      <p className="text-muted">{localSubject.description}</p>

      <TopicSelector
        subject={localSubject}
        selectedTopicId={selectedTopicId}
        onSelectTopic={setSelectedTopicId}
      />

      <div className="btn-group flex-wrap mb-4">
        <button
          className={`btn ${
            activeTab === "flashcards" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("flashcards")}
        >
          Flashcards
        </button>

        <button
          className={`btn ${
            activeTab === "test" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("test")}
        >
          Practice Test
        </button>

        <button
          className={`btn ${
            activeTab === "notes" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>

        <button
          className={`btn ${
            activeTab === "glossary" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("glossary")}
        >
          Glossary
        </button>
      </div>

      {activeTab === "flashcards" && (
        <FlashcardPractice
          topic={selectedTopic}
          onMarkFlashcard={handleMarkFlashcard}
        />
      )}

      {activeTab === "test" && <PracticeTest topic={selectedTopic} />}

      {activeTab === "notes" && <RevisionNotes topic={selectedTopic} />}

      {activeTab === "glossary" && <Glossary topic={selectedTopic} />}
    </div>
  );
}

export default SubjectPage;