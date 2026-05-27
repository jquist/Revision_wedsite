import React, { useState } from "react";
import { getApiBaseUrl } from "../config/env";
import { uploadLectureFile } from "../lib/supabaseStorage";

const MAX_UPLOAD_MB = Number(process.env.REACT_APP_MAX_UPLOAD_MB || 75);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

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

function ProgressStepList({ steps, status }) {
  if (!steps.length) return null;

  return (
    <div className="ai-progress-box">
      <p className="ai-progress-title">
        {status === "error" ? "Progress before error" : "Progress"}
      </p>
      <ol>
        {steps.map((step, index) => (
          <li key={`${step.code}-${index}`} className={`ai-progress-step ${step.status}`}>
            <span>{step.message}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AiUploadPanel({ userId, subjectId, onTopicGenerated }) {
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState("");
  const [detailLevel, setDetailLevel] = useState("balanced");
  const [flashcardTarget, setFlashcardTarget] = useState(16);
  const [quizQuestionTarget, setQuizQuestionTarget] = useState(8);
  const [noteTarget, setNoteTarget] = useState(6);
  const [glossaryTarget, setGlossaryTarget] = useState(8);
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState(null);
  const [progressSteps, setProgressSteps] = useState([]);

  function resetProgress() {
    setProgressSteps([]);
    setError(null);
  }

  function addStep(code, message, statusValue = "ok") {
    const friendlyMessage = message
      .replace("Requesting signed upload URL from Render backend.", "Preparing secure upload link.")
      .replace("Requesting signed upload URL.", "Preparing secure upload link.")
      .replace("Signed upload URL created.", "Secure upload link ready.")
      .replace("Uploading file to Supabase Storage.", "Uploading file.")
      .replace("File uploaded to Supabase Storage.", "File uploaded.")
      .replace("Calling Render backend to extract text and generate topic.", "Reading the file and asking AI to make revision content.");

    setProgressSteps((current) => [
      ...current,
      {
        code,
        message: friendlyMessage,
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

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setProgressText("");
    setProgressSteps([]);

    if (selectedFile && selectedFile.size > MAX_UPLOAD_BYTES) {
      setError({
        code: "AI-004_FILE_TOO_LARGE",
        message: `This file is ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB. The current recommended maximum is ${MAX_UPLOAD_MB} MB. Split very large PowerPoints into smaller lecture files.`,
        stage: "validate"
      });
    }
  }

  async function handleGenerate() {
    resetProgress();

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

    if (file.size > MAX_UPLOAD_BYTES) {
      const formatted = {
        code: "AI-004_FILE_TOO_LARGE",
        message: `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The current recommended maximum is ${MAX_UPLOAD_MB} MB. Split very large PowerPoints into smaller lecture files.`,
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

      const uploaded = await uploadLectureFile({
        file,
        userId,
        subjectId,
        onProgress: setUploadPercent,
        onDebugStep: addStep
      });

      addStep("AI-030_UPLOAD_DONE", "Upload complete.");

      setStatus("generating");
      setProgressText("Extracting text and generating revision topic...");

      addStep("AI-040_GENERATE_REQUEST", "Reading the file and asking AI to make revision content.");

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
            topicName: topicName || file.name.replace(/\.[^.]+$/, ""),
            contentSettings: {
              detailLevel,
              flashcardTarget: Number(flashcardTarget),
              quizQuestionTarget: Number(quizQuestionTarget),
              noteTarget: Number(noteTarget),
              glossaryTarget: Number(glossaryTarget)
            }
          })
        },
        "AI-040"
      );

      if (!payload.topic) {
        throw new Error("[AI-050_NO_TOPIC] Backend succeeded but did not return a topic.");
      }

      setStatus("complete");
      setProgressText("Topic generated.");
      addStep("AI-060_COMPLETE", "Topic generated and added to this subject.");

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
          <p className="muted small mb-0">
            Recommended maximum file size: {MAX_UPLOAD_MB} MB. For very large PowerPoints, split the file by lecture or week first.
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
            onChange={handleFileChange}
          />
          <span className="file-drop-title">
            {file ? file.name : "Choose lecture file"}
          </span>
          <span className="muted">
            Secure upload → text extraction → AI-generated topic.
          </span>
        </label>
      </div>

      <div className="ai-options-card">
        <div className="ai-options-header">
          <h3>AI output settings</h3>
          <p className="muted mb-0">Choose how much content the AI should make. These are rough targets, not strict promises.</p>
        </div>

        <div className="ai-options-grid">
          <label className="field-block">
            <span>Detail level</span>
            <select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value)}>
              <option value="simple">Simple</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
              <option value="exam-cram">Exam cram</option>
            </select>
          </label>

          <label className="field-block">
            <span>Flashcards</span>
            <input
              type="number"
              min="4"
              max="60"
              value={flashcardTarget}
              onChange={(event) => setFlashcardTarget(event.target.value)}
            />
          </label>

          <label className="field-block">
            <span>Practice questions</span>
            <input
              type="number"
              min="0"
              max="40"
              value={quizQuestionTarget}
              onChange={(event) => setQuizQuestionTarget(event.target.value)}
            />
          </label>

          <label className="field-block">
            <span>Notes sections</span>
            <input
              type="number"
              min="1"
              max="20"
              value={noteTarget}
              onChange={(event) => setNoteTarget(event.target.value)}
            />
          </label>

          <label className="field-block">
            <span>Glossary terms</span>
            <input
              type="number"
              min="0"
              max="30"
              value={glossaryTarget}
              onChange={(event) => setGlossaryTarget(event.target.value)}
            />
          </label>
        </div>
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

      <ProgressStepList steps={progressSteps} status={status} />

      <div className="button-row">
        <button
          type="button"
          className="revision-btn revision-btn-primary"
          disabled={isBusy || Boolean(file && file.size > MAX_UPLOAD_BYTES)}
          onClick={handleGenerate}
        >
          {isBusy ? "Working..." : "Generate Topic"}
        </button>
      </div>
    </section>
  );
}
