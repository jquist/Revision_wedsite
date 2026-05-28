import React, { useMemo, useState } from "react";
import { getApiBaseUrl } from "../config/env";
import { uploadLectureFile } from "../lib/supabaseStorage";

const MAX_FILE_UPLOAD_MB = Number(process.env.REACT_APP_MAX_UPLOAD_MB || 75);
const MAX_TOTAL_UPLOAD_MB = Number(process.env.REACT_APP_MAX_TOTAL_UPLOAD_MB || 150);
const MAX_FILES_PER_IMPORT = Number(process.env.REACT_APP_MAX_FILES_PER_IMPORT || 8);
const MAX_FILE_UPLOAD_BYTES = MAX_FILE_UPLOAD_MB * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_MB * 1024 * 1024;
const QUESTION_TYPE_OPTIONS = [
  { key: "single_choice", title: "Multiple choice", description: "One correct answer." },
  { key: "multi_select", title: "Select multiple", description: "Two or more correct answers." },
  { key: "written", title: "Written answer", description: "User types an answer; AI can mark it." },
  { key: "fill_blank", title: "Fill in the blank", description: "Short typed recall answers." },
  { key: "matching", title: "Match lists", description: "Left list to right list using numbers/letters." },
  { key: "ordering", title: "Order steps", description: "Put a process in the correct order." },
  { key: "true_false", title: "True or false", description: "Quick misconception checks." }
];

const DEFAULT_QUESTION_TYPES = {
  single_choice: true,
  multi_select: false,
  written: true,
  fill_blank: false,
  matching: false,
  ordering: false,
  true_false: false
};


function formatBytes(bytes = 0) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

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

export default function AiUploadPanel({
  userId,
  subjectId,
  topics = [],
  selectedTopicId = "",
  onTopicGenerated
}) {
  const [files, setFiles] = useState([]);
  const [topicName, setTopicName] = useState("");
  const [destinationMode, setDestinationMode] = useState("new");
  const [existingTopicId, setExistingTopicId] = useState(selectedTopicId || "");
  const [detailLevel, setDetailLevel] = useState("balanced");
  const [aiDecidesQuantities, setAiDecidesQuantities] = useState(true);
  const [flashcardTarget, setFlashcardTarget] = useState(16);
  const [quizQuestionTarget, setQuizQuestionTarget] = useState(8);
  const [noteTarget, setNoteTarget] = useState(6);
  const [questionTypes, setQuestionTypes] = useState(DEFAULT_QUESTION_TYPES);
  const [questionMixMode, setQuestionMixMode] = useState("ai_decide");
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState(null);
  const [progressSteps, setProgressSteps] = useState([]);

  const totalBytes = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files]
  );

  const existingTopicOptions = (topics || []).filter((topic) => topic?.topicId && topic.topicId !== "all-topics");
  const hasExistingTopicOptions = existingTopicOptions.length > 0;
  const selectedQuestionTypeCount = Object.values(questionTypes).filter(Boolean).length;

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

  function validateFiles(nextFiles) {
    if (!nextFiles.length) return null;

    if (nextFiles.length > MAX_FILES_PER_IMPORT) {
      return {
        code: "AI-005_TOO_MANY_FILES",
        message: `You selected ${nextFiles.length} files. The current limit is ${MAX_FILES_PER_IMPORT} files per AI import.`,
        stage: "validate"
      };
    }

    const oversizedFile = nextFiles.find((item) => item.size > MAX_FILE_UPLOAD_BYTES);
    if (oversizedFile) {
      return {
        code: "AI-004_FILE_TOO_LARGE",
        message: `${oversizedFile.name} is ${formatBytes(oversizedFile.size)}. The current per-file maximum is ${MAX_FILE_UPLOAD_MB} MB. Split very large PowerPoints into smaller files.`,
        stage: "validate"
      };
    }

    const totalSize = nextFiles.reduce((total, item) => total + item.size, 0);
    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      return {
        code: "AI-006_TOTAL_UPLOAD_TOO_LARGE",
        message: `These files are ${formatBytes(totalSize)} combined. The current total maximum per AI import is ${MAX_TOTAL_UPLOAD_MB} MB.`,
        stage: "validate"
      };
    }

    return null;
  }

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    setError(null);
    setProgressText("");
    setProgressSteps([]);

    const validationError = validateFiles(selectedFiles);
    if (validationError) {
      setError(validationError);
    }
  }

  function toggleQuestionType(typeKey) {
    setQuestionTypes((current) => ({
      ...current,
      [typeKey]: !current[typeKey]
    }));
  }

  function buildContentSettings() {
    const baseSettings = {
      detailLevel,
      autoTargets: aiDecidesQuantities,
      questionTypes,
      questionMixMode
    };

    if (aiDecidesQuantities) {
      return baseSettings;
    }

    return {
      ...baseSettings,
      flashcardTarget: Number(flashcardTarget),
      quizQuestionTarget: selectedQuestionTypeCount > 0 ? Number(quizQuestionTarget) : 0,
      noteTarget: Number(noteTarget)
    };
  }

  function getDefaultTopicName() {
    if (topicName.trim()) return topicName.trim();
    if (files.length === 1) return files[0].name.replace(/\.[^.]+$/, "");
    if (destinationMode === "existing") {
      const existingTopic = existingTopicOptions.find((topic) => topic.topicId === existingTopicId);
      if (existingTopic?.topicName) return existingTopic.topicName;
    }
    return "Combined Lecture Topic";
  }

  async function uploadAllSelectedFiles() {
    const uploadedFiles = [];

    for (let index = 0; index < files.length; index += 1) {
      const currentFile = files[index];
      const displayIndex = index + 1;

      addStep("AI-020_UPLOAD_FILE_START", `Uploading file ${displayIndex} of ${files.length}: ${currentFile.name}.`);

      const uploaded = await uploadLectureFile({
        file: currentFile,
        userId,
        subjectId,
        onProgress: (fileProgress) => {
          const overallProgress = Math.round(((index + (Number(fileProgress) || 0) / 100) / files.length) * 100);
          setUploadPercent(Math.min(100, Math.max(0, overallProgress)));
        },
        onDebugStep: addStep
      });

      uploadedFiles.push(uploaded);
      setUploadPercent(Math.round((uploadedFiles.length / files.length) * 100));
      addStep("AI-030_UPLOAD_FILE_DONE", `File ${displayIndex} uploaded: ${currentFile.name}.`);
    }

    return uploadedFiles;
  }

  async function handleGenerate() {
    resetProgress();

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      addStep(validationError.code, validationError.message, "error");
      return;
    }

    if (!files.length) {
      const formatted = {
        code: "AI-001_NO_FILE",
        message: "Choose at least one lecture file first.",
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

    if (destinationMode === "existing" && !existingTopicId) {
      const formatted = {
        code: "AI-007_NO_DESTINATION_TOPIC",
        message: "Choose the existing topic you want to add this generated content to.",
        stage: "validate"
      };
      setError(formatted);
      addStep(formatted.code, formatted.message, "error");
      return;
    }

    try {
      setStatus("uploading");
      setProgressText(files.length === 1 ? "Uploading lecture file..." : `Uploading ${files.length} lecture files...`);
      setUploadPercent(0);

      addStep(
        "AI-010_START",
        files.length === 1
          ? `Starting import for ${files[0].name}.`
          : `Starting combined import for ${files.length} files.`
      );

      const uploadedFiles = await uploadAllSelectedFiles();

      addStep("AI-035_UPLOADS_DONE", files.length === 1 ? "Upload complete." : "All files uploaded.");

      setStatus("generating");
      setProgressText("Extracting text from all files and generating revision topic...");

      addStep("AI-040_GENERATE_REQUEST", "Reading the file and asking AI to make revision content.");

      const resolvedTopicName = getDefaultTopicName();
      const payload = await fetchJsonWithDebug(
        `${getApiBaseUrl()}/api/ai/generate-topic-from-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            files: uploadedFiles,
            // Single-file fields are kept for backward compatibility with older backend versions.
            bucket: uploadedFiles[0]?.bucket,
            filePath: uploadedFiles[0]?.filePath,
            fileName: uploadedFiles[0]?.fileName,
            mimeType: uploadedFiles[0]?.mimeType,
            subjectId,
            topicName: resolvedTopicName,
            destinationMode,
            existingTopicId: destinationMode === "existing" ? existingTopicId : "",
            contentSettings: buildContentSettings()
          })
        },
        "AI-040"
      );

      if (!payload.topic) {
        throw new Error("[AI-050_NO_TOPIC] Backend succeeded but did not return a topic.");
      }

      setStatus("complete");
      setProgressText(destinationMode === "existing" ? "Content generated and added to topic." : "Topic generated.");
      addStep(
        "AI-060_COMPLETE",
        destinationMode === "existing"
          ? "Generated content added to the selected topic."
          : "Topic generated and added to this subject."
      );

      if (onTopicGenerated) {
        onTopicGenerated(payload.topic, {
          destinationMode,
          existingTopicId: destinationMode === "existing" ? existingTopicId : ""
        });
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
  const invalidSelection = Boolean(validateFiles(files));
  const selectedFileLabel = files.length === 0
    ? "Choose lecture file(s)"
    : files.length === 1
      ? files[0].name
      : `${files.length} files selected`;

  return (
    <section className="revision-glass-card ai-upload-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">AI Import</p>
          <h2>Generate revision from lecture file(s)</h2>
          <p className="muted">
            Upload one file, or several files that belong to the same topic. The AI combines them into one revision topic.
          </p>
          <p className="muted small mb-0">
            Current limits: {MAX_FILE_UPLOAD_MB} MB per file, {MAX_TOTAL_UPLOAD_MB} MB total, max {MAX_FILES_PER_IMPORT} files per import. For very large PowerPoints, split the file by lecture or week first.
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
            multiple
            accept=".pdf,.docx,.pptx,.txt"
            onChange={handleFileChange}
          />
          <span className="file-drop-title">
            {selectedFileLabel}
          </span>
          <span className="muted">
            Secure upload → text extraction → combined AI-generated topic.
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="selected-files-card">
          <div className="selected-files-header">
            <strong>Selected files</strong>
            <span>{formatBytes(totalBytes)} total</span>
          </div>
          <ul className="selected-files-list">
            {files.map((selectedFile, index) => (
              <li key={`${selectedFile.name}-${selectedFile.size}-${index}`}>
                <span>{selectedFile.name}</span>
                <small>{formatBytes(selectedFile.size)}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ai-options-card ai-question-types-card">
        <div className="ai-options-header">
          <h3>Practice question styles</h3>
          <p className="muted mb-0">
            Choose any mix. Multiple choice is optional, so users can generate written, matching, fill-blank, or mixed tests instead.
          </p>
        </div>

        <div className="ai-question-type-grid">
          {QUESTION_TYPE_OPTIONS.map((option) => (
            <label className="ai-question-type-tile" key={option.key}>
              <input
                type="checkbox"
                checked={Boolean(questionTypes[option.key])}
                onChange={() => toggleQuestionType(option.key)}
              />
              <span>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="ai-options-grid ai-options-grid-compact mt-3">
          <label className="field-block">
            <span>Question mix</span>
            <select
              value={questionMixMode}
              onChange={(event) => setQuestionMixMode(event.target.value)}
              disabled={selectedQuestionTypeCount === 0}
            >
              <option value="ai_decide">Let AI choose best mix</option>
              <option value="balanced_mix">Use selected types evenly</option>
            </select>
          </label>

          <div className="ai-question-type-summary">
            {selectedQuestionTypeCount > 0
              ? `${selectedQuestionTypeCount} question type${selectedQuestionTypeCount === 1 ? "" : "s"} selected.`
              : "No practice questions selected. The AI will still make notes and flashcards."}
          </div>
        </div>
      </div>

      <div className="ai-options-card">
        <div className="ai-options-header">
          <h3>Save destination</h3>
          <p className="muted mb-0">
            Create a new topic from the uploaded file(s), or add the generated content to an existing topic.
          </p>
        </div>

        <div className="ai-options-grid ai-options-grid-compact">
          <label className="field-block">
            <span>Destination</span>
            <select
              value={destinationMode}
              onChange={(event) => setDestinationMode(event.target.value)}
            >
              <option value="new">Create a new topic</option>
              <option value="existing" disabled={!hasExistingTopicOptions}>Add to existing topic</option>
            </select>
          </label>

          {destinationMode === "existing" && (
            <label className="field-block">
              <span>Existing topic</span>
              <select
                value={existingTopicId}
                onChange={(event) => setExistingTopicId(event.target.value)}
              >
                <option value="">Choose topic</option>
                {existingTopicOptions.map((topic) => (
                  <option key={topic.topicId} value={topic.topicId}>
                    {topic.topicName}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="ai-options-card">
        <div className="ai-options-header">
          <h3>AI output settings</h3>
          <p className="muted mb-0">
            Pick the revision style. Let AI decide the amount, or switch to manual targets.
          </p>
        </div>

        <div className="ai-options-grid ai-options-grid-compact">
          <label className="field-block">
            <span>Detail level</span>
            <select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value)}>
              <option value="simple">Simple</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
              <option value="exam-cram">Exam cram</option>
            </select>
          </label>

          <label className="ai-toggle-card">
            <input
              type="checkbox"
              checked={aiDecidesQuantities}
              onChange={(event) => setAiDecidesQuantities(event.target.checked)}
            />
            <span>
              <strong>AI decides quantities</strong>
              <small>Recommended: AI chooses suitable numbers for the combined file size and detail level.</small>
            </span>
          </label>
        </div>

        {!aiDecidesQuantities && (
          <div className="ai-options-grid manual-target-grid">
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
          </div>
        )}
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
          disabled={isBusy || invalidSelection}
          onClick={handleGenerate}
        >
          {isBusy ? "Working..." : files.length > 1 ? "Generate Combined Topic" : "Generate Topic"}
        </button>
      </div>
    </section>
  );
}
