import React, { useState } from "react";
import TopicSelector from "../components/TopicSelector";
import FlashcardPractice from "../components/FlashcardPractice";
import PracticeTest from "../components/PracticeTest";
import RevisionNotes from "../components/RevisionNotes";
import Glossary from "../components/Glossary";
import {
  ALL_TOPICS_ID,
  addFlashcard,
  addTopic,
  createBlankTopic,
  findTopicById,
  updateFlashcardProgress,
  resetFlashcardStats,
} from "../utils/revisionHelpers";

function SubjectPage({ subject, onBack, onUpdateSubject }) {
  const [selectedTopicId, setSelectedTopicId] = useState(ALL_TOPICS_ID);
  const [activeTab, setActiveTab] = useState("flashcards");
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicSummary, setNewTopicSummary] = useState("");

  const selectedTopic = findTopicById(subject, selectedTopicId);

  function handleMarkFlashcard(topicId, flashcardId, wasCorrect) {
    const updatedSubject = updateFlashcardProgress(subject, topicId, flashcardId, wasCorrect);
    onUpdateSubject(updatedSubject);
  }

  function handleAddFlashcard(newCard) {
    const updatedSubject = addFlashcard(subject, selectedTopicId, newCard);
    onUpdateSubject(updatedSubject);
  }

  function handleAddTopic(event) {
    event.preventDefault();
    const cleanName = newTopicName.trim();
    if (!cleanName) return;

    const newTopic = createBlankTopic({
      topicName: cleanName,
      summary: newTopicSummary.trim(),
      existingTopics: subject.topics || [],
    });

    const updatedSubject = addTopic(subject, newTopic);
    onUpdateSubject(updatedSubject);
    setSelectedTopicId(newTopic.topicId);
    setActiveTab("flashcards");
    setNewTopicName("");
    setNewTopicSummary("");
    setShowNewTopicForm(false);
  }

  function handleRefreshCardStats(visibleFlashcardIds) {
    const updatedSubject = resetFlashcardStats(subject, selectedTopicId, visibleFlashcardIds);
    onUpdateSubject(updatedSubject);
  }

  return (
    <div className="container py-4">
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        Back
      </button>

      <h1>{subject.subjectName}</h1>
      <p className="text-muted">{subject.description}</p>

      <div className="row g-2 align-items-end mb-3">
        <div className="col-md">
          <TopicSelector subject={subject} selectedTopicId={selectedTopicId} onSelectTopic={setSelectedTopicId} />
        </div>
        <div className="col-md-auto mb-3">
          <button className="btn btn-success" onClick={() => setShowNewTopicForm((isOpen) => !isOpen)}>
            {showNewTopicForm ? "Cancel New Topic" : "+ New Topic"}
          </button>
        </div>
      </div>

      {showNewTopicForm && (
        <form className="card revision-card shadow-sm mb-4" onSubmit={handleAddTopic}>
          <div className="card-body">
            <h2 className="h5">Create a new topic</h2>
            <div className="mb-3">
              <label className="form-label" htmlFor="new-topic-name">Topic name</label>
              <input
                id="new-topic-name"
                className="form-control"
                value={newTopicName}
                onChange={(event) => setNewTopicName(event.target.value)}
                placeholder="e.g. Week 1 - Networking Basics"
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="new-topic-summary">Summary / description optional</label>
              <textarea
                id="new-topic-summary"
                className="form-control"
                rows="3"
                value={newTopicSummary}
                onChange={(event) => setNewTopicSummary(event.target.value)}
                placeholder="Briefly describe what this topic is for."
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={!newTopicName.trim()}>
                Create Topic
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setShowNewTopicForm(false);
                  setNewTopicName("");
                  setNewTopicSummary("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="btn-group flex-wrap mb-4">
        <button
          className={`btn ${activeTab === "flashcards" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("flashcards")}
        >
          Flashcards
        </button>
        <button
          className={`btn ${activeTab === "test" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("test")}
        >
          Practice Test
        </button>
        <button
          className={`btn ${activeTab === "notes" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button
          className={`btn ${activeTab === "glossary" ? "btn-primary" : "btn-outline-primary"}`}
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
    </div>
  );
}

export default SubjectPage;
