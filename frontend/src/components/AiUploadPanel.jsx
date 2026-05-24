import React, { useState } from "react";
import { uploadLectureFile } from "../lib/supabaseStorage";

/**
 * AI upload panel.
 *
 * Props:
 * - userId: current logged in user's id
 * - subjectId: current subject id
 * - apiBaseUrl: usually "http://localhost:4000" in dev or "" if same origin
 * - onTopicGenerated(topic): called when AI returns a generated topic
 */
export default function AiUploadPanel({
  userId,
  subjectId,
  apiBaseUrl = "",
  onTopicGenerated
}) {
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState("");
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");

    if (!file) {
      setError("Choose a lecture file first.");
      return;
    }

    try {
      setStatus("uploading");
      setProgressText("Uploading lecture file...");
      setUploadPercent(0);

      const uploaded = await uploadLectureFile({
        file,
        userId,
        subjectId,
        onProgress: setUploadPercent
      });

      setStatus("generating");
      setProgressText("Extracting text and generating revision topic...");

      const response = await fetch(`${apiBaseUrl}/api/ai/generate-topic-from-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bucket: uploaded.bucket,
          filePath: uploaded.filePath,
          fileName: uploaded.fileName,
          subjectId,
          topicName: topicName || file.name.replace(/\.[^.]+$/, "")
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "AI generation failed.");
      }

      setStatus("complete");
      setProgressText("Topic generated.");

      if (onTopicGenerated) {
        onTopicGenerated(payload.topic);
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong.");
      setProgressText("");
    }
  }

  const isBusy = status === "uploading" || status === "generating";

  return (
    <section className="revision-glass-card ai-upload-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">AI Import</p>
          <h2>Generate revision from a lecture file</h2>
          <p className="muted">
            Upload a PDF, DOCX or PowerPoint and turn it into notes, flashcards,
            glossary terms and quiz questions.
          </p>
        </div>
      </div>

      <div className="ai-upload-grid">
        <label className="field-block">
          <span>Topic name</span>
          <input
            value={topicName}
            onChange={(event) => setTopicName(event.target.value)}
            placeholder="Example: Lecture 1 - Introduction"
          />
        </label>

        <label className="file-drop-zone">
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.txt"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <span className="file-drop-title">
            {file ? file.name : "Choose lecture file"}
          </span>
          <span className="muted">
            PDF, DOCX, PPTX or TXT. Large files upload to storage first.
          </span>
        </label>
      </div>

      {status === "uploading" && (
        <div className="progress-shell">
          <div
            className="progress-fill"
            style={{ width: `${uploadPercent}%` }}
          />
        </div>
      )}

      {progressText && <p className="status-text">{progressText}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="button-row">
        <button
          type="button"
          className="revision-btn revision-btn-primary"
          disabled={isBusy}
          onClick={handleGenerate}
        >
          {isBusy ? "Working..." : "Generate Topic"}
        </button>
      </div>
    </section>
  );
}
