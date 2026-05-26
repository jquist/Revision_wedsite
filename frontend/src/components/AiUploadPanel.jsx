import React, { useState } from "react";
import { getApiBaseUrl } from "../config/env";
import { uploadLectureFile } from "../lib/supabaseStorage";

export default function AiUploadPanel({ userId, subjectId, onTopicGenerated }) {
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState("");
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  async function handleGenerate() {
    setError("");

    if (!file) {
      setError("Choose a lecture file first.");
      return;
    }

    try {
      setStatus("uploading");
      setStage("upload");
      setProgressText("Uploading lecture file...");
      setUploadPercent(0);

      const uploaded = await uploadLectureFile({
        file,
        userId,
        subjectId,
        onProgress: setUploadPercent
      });

      setStatus("generating");
      setStage("ai");
      setProgressText("Extracting text and generating revision topic...");

      const response = await fetch(
        `${getApiBaseUrl()}/api/ai/generate-topic-from-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            bucket: uploaded.bucket,
            filePath: uploaded.filePath,
            fileName: uploaded.fileName,
            mimeType: uploaded.mimeType,
            subjectId,
            topicName: topicName || file.name.replace(/\.[^.]+$/, "")
          })
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `AI generation failed (${response.status}).`);
      }

      setStatus("complete");
      setStage("");
      setProgressText("Topic generated.");

      if (onTopicGenerated) {
        onTopicGenerated(payload.topic);
      }
    } catch (err) {
      setStatus("error");
      setError(`${stage === "upload" ? "Upload failed" : stage === "ai" ? "AI generation failed" : "Something went wrong"}: ${err.message || "Unknown error"}`);
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
            Upload a PDF, DOCX, PowerPoint or TXT file and generate notes,
            flashcards, glossary terms and quiz questions.
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
            Larger files upload to Supabase Storage before AI processing.
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
      {error && <p className="muted small">Check Render logs if this says AI generation failed. Check Supabase Storage bucket if this says upload failed.</p>}

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
