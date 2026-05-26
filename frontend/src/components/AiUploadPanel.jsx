import React, { useState } from "react";
import { getApiBaseUrl } from "../config/env";
import { uploadLectureFile } from "../lib/supabaseStorage";

function formatError(stage, error) {
  const message = error?.message || String(error || "Unknown error");
  const codeMatch = message.match(/^\[([A-Z0-9_-]+)\]\s*(.*)$/);

  if (codeMatch) {
    return {
      code: codeMatch[1],
      message: codeMatch[2] || message,
      stage
    };
  }

  return {
    code: stage || "UNKNOWN_STAGE",
    message,
    stage
  };
}

function DebugStepList({ steps }) {
  if (!steps.length) return null;

  return (
    <div className="ai-debug-box">
      <p className="ai-debug-title">Debug steps</p>
      <ol>
        {steps.map((step, index) => (
          <li key={`${step.code}-${index}`} className={`ai-debug-step ${step.status}`}>
            <strong>{step.code}</strong> — {step.message}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AiUploadPanel({ userId, subjectId, onTopicGenerated }) {
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState("");
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState(null);
  const [debugSteps, setDebugSteps] = useState([]);

  function resetDebug() {
    setDebugSteps([]);
    setError(null);
  }

  function addStep(code, message, statusValue = "ok") {
    setDebugSteps((current) => [
      ...current,
      {
        code,
        message,
        status: statusValue,
        at: new Date().toISOString()
      }
    ]);
  }

  async function fetchJsonWithDebug(url, options, stageCode) {
    let response;
    let rawText = "";

    try {
      response = await fetch(url, options);
    } catch (fetchError) {
      throw new Error(`[${stageCode}_NETWORK] ${fetchError.message || "Network request failed."}`);
    }

    try {
      rawText = await response.text();
    } catch (readError) {
      throw new Error(`[${stageCode}_READ_RESPONSE] Could not read server response.`);
    }

    let payload = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch (jsonError) {
      throw new Error(`[${stageCode}_INVALID_JSON] Server returned non-JSON response: ${rawText.slice(0, 160)}`);
    }

    if (!response.ok || !payload?.success) {
      const backendCode = payload?.code ? `${stageCode}_${payload.code}` : `${stageCode}_SERVER_ERROR`;
      throw new Error(`[${backendCode}] ${payload?.error || `Request failed with status ${response.status}.`}`);
    }

    return payload;
  }

  async function handleGenerate() {
    resetDebug();

    if (!file) {
      const formatted = {
        code: "AI-001_NO_FILE",
        message: "Choose a lecture file first.",
        stage: "validate"
      };
      setError(formatted);
      addStep(formatted.code, formatted.message, "error");
      return;
    }

    if (!userId) {
      const formatted = {
        code: "AI-002_NO_USER",
        message: "No logged-in user id was passed to the AI upload panel.",
        stage: "validate"
      };
      setError(formatted);
      addStep(formatted.code, formatted.message, "error");
      return;
    }

    if (!subjectId) {
      const formatted = {
        code: "AI-003_NO_SUBJECT",
        message: "No subject id was passed to the AI upload panel.",
        stage: "validate"
      };
      setError(formatted);
      addStep(formatted.code, formatted.message, "error");
      return;
    }

    try {
      setStatus("uploading");
      setProgressText("Uploading lecture file...");
      setUploadPercent(0);

      addStep("AI-010_START", `Starting import for ${file.name}.`);

      addStep("AI-020_SIGNED_UPLOAD", "Requesting signed upload URL from Render backend.");
      const uploaded = await uploadLectureFile({
        file,
        userId,
        subjectId,
        onProgress: setUploadPercent,
        onDebugStep: addStep
      });

      addStep("AI-030_UPLOAD_DONE", `Uploaded file to Supabase Storage path: ${uploaded.filePath}.`);

      setStatus("generating");
      setProgressText("Extracting text and generating revision topic...");

      addStep("AI-040_GENERATE_REQUEST", "Calling Render backend to extract text and generate topic.");

      const payload = await fetchJsonWithDebug(
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
        },
        "AI-040"
      );

      if (!payload.topic) {
        throw new Error("[AI-050_NO_TOPIC] Backend succeeded but did not return a topic.");
      }

      setStatus("complete");
      setProgressText("Topic generated.");
      addStep("AI-060_COMPLETE", "Topic generated and returned to the website.");

      if (onTopicGenerated) {
        onTopicGenerated(payload.topic);
      }
    } catch (err) {
      const formatted = formatError("import", err);
      console.error("AI_IMPORT_DEBUG_ERROR", formatted, err);
      setStatus("error");
      setError(formatted);
      setProgressText("");
      addStep(formatted.code, formatted.message, "error");
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

      {error && (
        <div className="ai-error-card">
          <p className="ai-error-code">{error.code}</p>
          <p className="error-text">{error.message}</p>
        </div>
      )}

      <DebugStepList steps={debugSteps} />

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
