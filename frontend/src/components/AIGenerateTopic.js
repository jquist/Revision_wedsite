import React, { useState } from "react";
import { generateTopicWithAI } from "../utils/api";

function AIGenerateTopic({ subject, onSaveGeneratedTopic }) {
  const [topicName, setTopicName] = useState("");
  const [lectureText, setLectureText] = useState("");
  const [generatedTopic, setGeneratedTopic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGenerate(event) {
    event.preventDefault();

    setIsGenerating(true);
    setMessage("");
    setGeneratedTopic(null);

    try {
      const topic = await generateTopicWithAI({
        subjectName: subject.subjectName,
        topicName,
        lectureText,
      });

      setGeneratedTopic(topic);
      setMessage("Topic generated. Review it, then save it to this subject.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSave() {
    if (!generatedTopic) {
      return;
    }

    onSaveGeneratedTopic(generatedTopic);
    setTopicName("");
    setLectureText("");
    setGeneratedTopic(null);
    setMessage("Generated topic saved.");
  }

  return (
    <div>
      <h2>AI Generate Topic</h2>

      <p className="text-muted">
        Paste lecture text and the backend will ask AI to turn it into revision
        notes, flashcards, quiz questions, and glossary terms.
      </p>

      <div className="alert alert-warning small">
        Check the generated content before using it for revision. AI can make
        mistakes, especially if the lecture text is unclear or incomplete.
      </div>

      <form className="card shadow-sm mb-3" onSubmit={handleGenerate}>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Topic name</label>
            <input
              className="form-control"
              value={topicName}
              onChange={(event) => setTopicName(event.target.value)}
              placeholder="Example: DNS, Search Algorithms, Databases Week 2"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Lecture text</label>
            <textarea
              className="form-control"
              rows="10"
              value={lectureText}
              onChange={(event) => setLectureText(event.target.value)}
              placeholder="Paste lecture notes, transcript text, or copied PDF text here..."
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isGenerating || lectureText.trim().length < 50}
          >
            {isGenerating ? "Generating..." : "Generate Topic"}
          </button>
        </div>
      </form>

      {message && (
        <div className={`alert ${generatedTopic ? "alert-success" : "alert-info"}`}>
          {message}
        </div>
      )}

      {generatedTopic && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <h3>{generatedTopic.topicName}</h3>
                <p className="text-muted">{generatedTopic.summary}</p>
              </div>

              <button className="btn btn-success" onClick={handleSave}>
                Save Topic
              </button>
            </div>

            <hr />

            <div className="row g-3">
              <div className="col-md-3">
                <strong>{generatedTopic.notes?.length || 0}</strong>
                <div className="small text-muted">notes</div>
              </div>

              <div className="col-md-3">
                <strong>{generatedTopic.flashcards?.length || 0}</strong>
                <div className="small text-muted">flashcards</div>
              </div>

              <div className="col-md-3">
                <strong>{generatedTopic.quizQuestions?.length || 0}</strong>
                <div className="small text-muted">quiz questions</div>
              </div>

              <div className="col-md-3">
                <strong>{generatedTopic.glossary?.length || 0}</strong>
                <div className="small text-muted">glossary terms</div>
              </div>
            </div>

            <details className="mt-3">
              <summary>Preview generated JSON</summary>
              <pre className="json-preview mt-3">
                {JSON.stringify(generatedTopic, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIGenerateTopic;
