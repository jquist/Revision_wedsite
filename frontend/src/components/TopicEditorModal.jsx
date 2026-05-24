import React, { useEffect, useState } from "react";
import {
  makeFlashcard,
  makeQuizQuestion,
  normaliseTopic
} from "../utils/topicUtils";

/**
 * Topic editor modal.
 *
 * Props:
 * - show
 * - topic
 * - onSave(updatedTopic)
 * - onDelete(topicId)
 * - onClose()
 */
export default function TopicEditorModal({
  show,
  topic,
  onSave,
  onDelete,
  onClose
}) {
  const [draft, setDraft] = useState(normaliseTopic(topic || {}));
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (show) {
      setDraft(normaliseTopic(topic || {}));
      setActiveTab("overview");
    }
  }, [show, topic]);

  if (!show) return null;

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateFlashcard(index, field, value) {
    setDraft((current) => {
      const flashcards = [...current.flashcards];
      flashcards[index] = {
        ...flashcards[index],
        [field]: field === "tags"
          ? value.split(",").map((tag) => tag.trim()).filter(Boolean)
          : value
      };
      return { ...current, flashcards };
    });
  }

  function addFlashcard() {
    setDraft((current) => ({
      ...current,
      flashcards: [...current.flashcards, makeFlashcard()]
    }));
  }

  function removeFlashcard(index) {
    setDraft((current) => ({
      ...current,
      flashcards: current.flashcards.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateNote(index, value) {
    setDraft((current) => {
      const notes = [...current.notes];
      notes[index] = value;
      return { ...current, notes };
    });
  }

  function addNote() {
    setDraft((current) => ({
      ...current,
      notes: [...current.notes, ""]
    }));
  }

  function removeNote(index) {
    setDraft((current) => ({
      ...current,
      notes: current.notes.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateQuiz(index, field, value) {
    setDraft((current) => {
      const quizQuestions = [...current.quizQuestions];
      quizQuestions[index] = {
        ...quizQuestions[index],
        [field]: value
      };
      return { ...current, quizQuestions };
    });
  }

  function updateQuizOption(questionIndex, optionIndex, value) {
    setDraft((current) => {
      const quizQuestions = [...current.quizQuestions];
      const options = [...(quizQuestions[questionIndex].options || [])];
      options[optionIndex] = value;
      quizQuestions[questionIndex] = {
        ...quizQuestions[questionIndex],
        options
      };
      return { ...current, quizQuestions };
    });
  }

  function addQuizQuestion() {
    setDraft((current) => ({
      ...current,
      quizQuestions: [...current.quizQuestions, makeQuizQuestion()]
    }));
  }

  function removeQuizQuestion(index) {
    setDraft((current) => ({
      ...current,
      quizQuestions: current.quizQuestions.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateGlossary(index, field, value) {
    setDraft((current) => {
      const glossary = [...current.glossary];
      glossary[index] = {
        ...(typeof glossary[index] === "object" ? glossary[index] : { term: glossary[index], definition: "" }),
        [field]: value
      };
      return { ...current, glossary };
    });
  }

  function addGlossaryTerm() {
    setDraft((current) => ({
      ...current,
      glossary: [...current.glossary, { term: "", definition: "" }]
    }));
  }

  function removeGlossaryTerm(index) {
    setDraft((current) => ({
      ...current,
      glossary: current.glossary.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function handleSave() {
    onSave(normaliseTopic(draft));
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${draft.topicName}"? This cannot be undone.`
    );

    if (confirmed) {
      onDelete(draft.topicId);
    }
  }

  return (
    <div className="revision-modal-backdrop" role="presentation">
      <div
        className="revision-modal revision-glass-card"
        role="dialog"
        aria-modal="true"
        aria-label="Edit topic"
      >
        <div className="revision-modal-header">
          <div>
            <p className="eyebrow">Topic Editor</p>
            <h2>Edit topic content</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close topic editor"
          >
            ×
          </button>
        </div>

        <div className="tab-row">
          {["overview", "notes", "flashcards", "quiz", "glossary"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="revision-modal-body">
          {activeTab === "overview" && (
            <div className="editor-stack">
              <label className="field-block">
                <span>Topic name</span>
                <input
                  value={draft.topicName}
                  onChange={(event) => updateField("topicName", event.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Summary</span>
                <textarea
                  rows={6}
                  value={draft.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                />
              </label>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="editor-stack">
              {draft.notes.map((note, index) => (
                <div key={index} className="editor-item">
                  <label className="field-block">
                    <span>Note {index + 1}</span>
                    <textarea
                      rows={5}
                      value={typeof note === "string" ? note : JSON.stringify(note, null, 2)}
                      onChange={(event) => updateNote(index, event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="revision-btn revision-btn-danger"
                    onClick={() => removeNote(index)}
                  >
                    Delete Note
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="revision-btn revision-btn-secondary"
                onClick={addNote}
              >
                + Add Note
              </button>
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="editor-stack">
              {draft.flashcards.map((card, index) => (
                <div key={card.flashcardId || index} className="editor-item">
                  <label className="field-block">
                    <span>Question</span>
                    <textarea
                      rows={3}
                      value={card.question || card.front || ""}
                      onChange={(event) =>
                        updateFlashcard(index, "question", event.target.value)
                      }
                    />
                  </label>

                  <label className="field-block">
                    <span>Answer</span>
                    <textarea
                      rows={3}
                      value={card.answer || card.back || ""}
                      onChange={(event) =>
                        updateFlashcard(index, "answer", event.target.value)
                      }
                    />
                  </label>

                  <div className="two-column">
                    <label className="field-block">
                      <span>Difficulty</span>
                      <select
                        value={card.difficulty || "medium"}
                        onChange={(event) =>
                          updateFlashcard(index, "difficulty", event.target.value)
                        }
                      >
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="hard">hard</option>
                      </select>
                    </label>

                    <label className="field-block">
                      <span>Tags, comma separated</span>
                      <input
                        value={(card.tags || []).join(", ")}
                        onChange={(event) =>
                          updateFlashcard(index, "tags", event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="revision-btn revision-btn-danger"
                    onClick={() => removeFlashcard(index)}
                  >
                    Delete Flashcard
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="revision-btn revision-btn-secondary"
                onClick={addFlashcard}
              >
                + Add Flashcard
              </button>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="editor-stack">
              {draft.quizQuestions.map((question, index) => (
                <div key={question.questionId || index} className="editor-item">
                  <label className="field-block">
                    <span>Question</span>
                    <textarea
                      rows={3}
                      value={question.question || ""}
                      onChange={(event) =>
                        updateQuiz(index, "question", event.target.value)
                      }
                    />
                  </label>

                  <div className="two-column">
                    {(question.options || ["", "", "", ""]).map((option, optionIndex) => (
                      <label key={optionIndex} className="field-block">
                        <span>Option {optionIndex + 1}</span>
                        <input
                          value={option}
                          onChange={(event) =>
                            updateQuizOption(index, optionIndex, event.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <label className="field-block">
                    <span>Correct answer</span>
                    <input
                      value={question.answer || ""}
                      onChange={(event) =>
                        updateQuiz(index, "answer", event.target.value)
                      }
                    />
                  </label>

                  <label className="field-block">
                    <span>Explanation</span>
                    <textarea
                      rows={3}
                      value={question.explanation || ""}
                      onChange={(event) =>
                        updateQuiz(index, "explanation", event.target.value)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="revision-btn revision-btn-danger"
                    onClick={() => removeQuizQuestion(index)}
                  >
                    Delete Quiz Question
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="revision-btn revision-btn-secondary"
                onClick={addQuizQuestion}
              >
                + Add Quiz Question
              </button>
            </div>
          )}

          {activeTab === "glossary" && (
            <div className="editor-stack">
              {draft.glossary.map((item, index) => {
                const glossaryItem =
                  typeof item === "object" ? item : { term: String(item), definition: "" };

                return (
                  <div key={index} className="editor-item">
                    <div className="two-column">
                      <label className="field-block">
                        <span>Term</span>
                        <input
                          value={glossaryItem.term || ""}
                          onChange={(event) =>
                            updateGlossary(index, "term", event.target.value)
                          }
                        />
                      </label>

                      <label className="field-block">
                        <span>Definition</span>
                        <input
                          value={glossaryItem.definition || ""}
                          onChange={(event) =>
                            updateGlossary(index, "definition", event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="revision-btn revision-btn-danger"
                      onClick={() => removeGlossaryTerm(index)}
                    >
                      Delete Term
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="revision-btn revision-btn-secondary"
                onClick={addGlossaryTerm}
              >
                + Add Glossary Term
              </button>
            </div>
          )}
        </div>

        <div className="revision-modal-footer">
          <button
            type="button"
            className="revision-btn revision-btn-danger"
            onClick={handleDelete}
          >
            Delete Topic
          </button>

          <div className="button-row">
            <button
              type="button"
              className="revision-btn revision-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="revision-btn revision-btn-primary"
              onClick={handleSave}
            >
              Save Topic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
