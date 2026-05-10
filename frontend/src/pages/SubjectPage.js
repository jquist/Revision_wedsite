import React, { useState } from "react";
import TopicSelector from "../components/TopicSelector";
import FlashcardPractice from "../components/FlashcardPractice";
import PracticeTest from "../components/PracticeTest";
import RevisionNotes from "../components/RevisionNotes";
import Glossary from "../components/Glossary";
import AIGenerateTopic from "../components/AIGenerateTopic";
import {
  ALL_TOPICS_ID,
  addFlashcard,
  addTopicToSubject,
  findTopicById,
  updateFlashcardProgress,
  resetFlashcardStats,
} from "../utils/revisionHelpers";

function SubjectPage({ subject, onBack, onUpdateSubject }) {
  const [selectedTopicId, setSelectedTopicId] = useState(ALL_TOPICS_ID);
  const [activeTab, setActiveTab] = useState("flashcards");

  const selectedTopic = findTopicById(subject, selectedTopicId);

  function handleMarkFlashcard(topicId, flashcardId, wasCorrect) {
    const updatedSubject = updateFlashcardProgress(
      subject,
      topicId,
      flashcardId,
      wasCorrect
    );

    onUpdateSubject(updatedSubject);
  }

  function handleAddFlashcard(newCard) {
    const updatedSubject = addFlashcard(subject, selectedTopicId, newCard);
    onUpdateSubject(updatedSubject);
  }


  function handleSaveGeneratedTopic(generatedTopic) {
    const updatedSubject = addTopicToSubject(subject, generatedTopic);
    onUpdateSubject(updatedSubject);
    setSelectedTopicId(generatedTopic.topicId);
    setActiveTab("flashcards");
  }


  function handleRefreshCardStats(visibleFlashcardIds) {
    const updatedSubject = resetFlashcardStats(
      subject,
      selectedTopicId,
      visibleFlashcardIds
    );

    onUpdateSubject(updatedSubject);
  }


  return (
    <div className="container py-4">
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        Back
      </button>

      <h1>{subject.subjectName}</h1>
      <p className="text-muted">{subject.description}</p>

      <TopicSelector
        subject={subject}
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
            activeTab === "ai" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI Generate
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
          selectedTopicId={selectedTopicId}
          onMarkFlashcard={handleMarkFlashcard}
          onAddFlashcard={handleAddFlashcard}
          onRefreshCardStats={handleRefreshCardStats}
        />
      )}

      {activeTab === "test" && <PracticeTest topic={selectedTopic} />}

      {activeTab === "notes" && <RevisionNotes topic={selectedTopic} />}

      {activeTab === "glossary" && <Glossary topic={selectedTopic} />}

      {activeTab === "ai" && (
        <AIGenerateTopic
          subject={subject}
          onSaveGeneratedTopic={handleSaveGeneratedTopic}
        />
      )}
    </div>
  );
}

export default SubjectPage;
