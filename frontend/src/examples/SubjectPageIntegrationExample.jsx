import React, { useState } from "react";
import AiUploadPanel from "../components/AiUploadPanel";
import TopicEditorModal from "../components/TopicEditorModal";
import {
  addTopicToSubject,
  createBlankTopic,
  deleteTopicFromSubject,
  updateTopicInSubject
} from "../utils/topicUtils";

/**
 * This is not meant to replace your exact subject page.
 * It shows how to wire the new files into your existing page.
 */
export default function SubjectPageIntegrationExample({
  initialSubject,
  userId,
  saveSubjectToSupabase
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [editingTopic, setEditingTopic] = useState(null);

  async function saveUpdatedSubject(nextSubject) {
    setSubject(nextSubject);

    /**
     * Replace this with your existing Supabase update function.
     */
    if (saveSubjectToSupabase) {
      await saveSubjectToSupabase(nextSubject);
    }
  }

  async function handleTopicGenerated(topic) {
    const nextSubject = addTopicToSubject(subject, topic);
    await saveUpdatedSubject(nextSubject);
  }

  async function handleCreateTopic() {
    const topicName = window.prompt("Topic name?");

    if (!topicName) return;

    const nextSubject = addTopicToSubject(
      subject,
      createBlankTopic(topicName)
    );

    await saveUpdatedSubject(nextSubject);
  }

  async function handleSaveTopic(updatedTopic) {
    const nextSubject = updateTopicInSubject(subject, updatedTopic);
    await saveUpdatedSubject(nextSubject);
    setEditingTopic(null);
  }

  async function handleDeleteTopic(topicId) {
    const nextSubject = deleteTopicFromSubject(subject, topicId);
    await saveUpdatedSubject(nextSubject);
    setEditingTopic(null);
  }

  return (
    <main className="revision-pro-shell">
      <div className="revision-page-container">
        <header className="revision-hero">
          <div>
            <p className="eyebrow">Revision Subject</p>
            <h1>{subject.subjectName}</h1>
            <p className="muted">
              Manage topics, generate AI revision material, and study flashcards.
            </p>
          </div>

          <button
            type="button"
            className="revision-btn revision-btn-primary"
            onClick={handleCreateTopic}
          >
            + Create Topic
          </button>
        </header>

        <AiUploadPanel
          userId={userId}
          subjectId={subject.subjectId}
          apiBaseUrl=""
          onTopicGenerated={handleTopicGenerated}
        />

        <section className="topic-grid" style={{ marginTop: 20 }}>
          {(subject.topics || []).map((topic) => (
            <article
              key={topic.topicId}
              className="revision-glass-card topic-card"
            >
              <p className="eyebrow">Topic</p>
              <h2>{topic.topicName}</h2>
              <p className="muted">{topic.summary || "No summary yet."}</p>

              <div className="button-row">
                <button
                  type="button"
                  className="revision-btn revision-btn-secondary"
                >
                  Study
                </button>
                <button
                  type="button"
                  className="revision-btn revision-btn-primary"
                  onClick={() => setEditingTopic(topic)}
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
        </section>

        <TopicEditorModal
          show={Boolean(editingTopic)}
          topic={editingTopic}
          onSave={handleSaveTopic}
          onDelete={handleDeleteTopic}
          onClose={() => setEditingTopic(null)}
        />
      </div>
    </main>
  );
}
