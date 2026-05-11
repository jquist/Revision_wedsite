import React, { useState } from "react";
import {
  extractTextFromFile,
  fetchUploadChunk,
  generateTopicWithAI,
} from "../utils/api";

function AIGenerateTopic({ subject, onSaveGeneratedTopic }) {
  const [topicName, setTopicName] = useState("");
  const [lectureText, setLectureText] = useState("");
  const [generatedTopic, setGeneratedTopic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState("");

  async function handleFileUpload(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setIsExtractingFile(true);
    setMessage("");

    try {
      const extractedResults = [];

      for (const file of files) {
        const result = await extractTextFromFile(file);
        extractedResults.push(result);
      }

      for (const result of extractedResults) {
        if (result.mode === "text" && result.text) {
          setLectureText((currentText) =>
            `${currentText}\n\n--- Extracted from ${result.fileName} ---\n\n${result.text}`.trim()
          );
        }
      }

      setUploadedFiles((currentFiles) => [
        ...currentFiles,
        ...extractedResults.map((result) => ({
          fileName: result.fileName,
          uploadId: result.uploadId,
          mode: result.mode,
          characterCount: result.characterCount,
          chunkCount: result.chunkCount,
          chunks: result.chunks || [],
        })),
      ]);

      const hasChunkedFile = extractedResults.some((result) => result.mode === "chunks");

      setMessage(
        hasChunkedFile
          ? "Large file extracted into chunks. Choose a chunk below to use for AI generation."
          : "File text extracted and added to the lecture text box."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsExtractingFile(false);
      event.target.value = "";
    }
  }

  async function loadChunkIntoTextBox(uploadId, chunkIndex, fileName, chunkNumber) {
    setIsLoadingChunk(true);
    setMessage("");

    try {
      const result = await fetchUploadChunk(uploadId, chunkIndex);

      setLectureText(
        `--- ${fileName}, chunk ${chunkNumber} ---\n\n${result.text}`
      );

      setGeneratedTopic(null);
      setMessage(`Loaded chunk ${chunkNumber} into the lecture text box.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoadingChunk(false);
    }
  }

  async function appendChunkToTextBox(uploadId, chunkIndex, fileName, chunkNumber) {
    setIsLoadingChunk(true);
    setMessage("");

    try {
      const result = await fetchUploadChunk(uploadId, chunkIndex);

      setLectureText((currentText) =>
        `${currentText}\n\n--- ${fileName}, chunk ${chunkNumber} ---\n\n${result.text}`.trim()
      );

      setGeneratedTopic(null);
      setMessage(`Added chunk ${chunkNumber} to the lecture text box.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoadingChunk(false);
    }
  }

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
    setUploadedFiles([]);
    setGeneratedTopic(null);
    setMessage("Generated topic saved.");
  }

  function clearLectureText() {
    setLectureText("");
    setUploadedFiles([]);
    setGeneratedTopic(null);
    setMessage("");
  }

  return (
    <div>
      <h2>AI Generate Topic</h2>

      <p className="text-muted">
        Upload lecture files or paste lecture text. Large files are split into
        chunks so you can generate from one useful section at a time.
      </p>

      <div className="alert alert-warning small">
        Check generated content before using it for revision. AI can make
        mistakes. For very large files, choose the relevant chunk instead of
        sending everything at once.
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5">Upload files</h3>

          <p className="text-muted small">
            Supported: PDF, DOCX, PPTX, TXT, MD, CSV, and plain text/code files.
            Maximum 600MB per file. Large files are saved as text chunks.
          </p>

          <input
            className="form-control"
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.py,.java,.html,.css,.xml,.sql,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleFileUpload}
            disabled={isExtractingFile || isGenerating || isLoadingChunk}
          />

          {isExtractingFile && (
            <div className="alert alert-info mt-3 mb-0">
              Extracting text from file. Large files may take a bit.
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-3">
              <h4 className="h6">Uploaded file text</h4>

              {uploadedFiles.map((file, index) => (
                <div className="uploaded-file-box" key={`${file.fileName}-${index}`}>
                  <div className="d-flex justify-content-between gap-3 flex-wrap">
                    <div>
                      <strong>{file.fileName}</strong>
                      <div className="small text-muted">
                        {file.characterCount.toLocaleString()} characters
                        {file.mode === "chunks"
                          ? ` • ${file.chunkCount} chunks`
                          : " • added to text box"}
                      </div>
                    </div>
                  </div>

                  {file.mode === "chunks" && (
                    <div className="mt-3">
                      <p className="small text-muted mb-2">
                        Choose a chunk to load. “Use” replaces the lecture text box.
                        “Add” appends it.
                      </p>

                      <div className="chunk-list">
                        {file.chunks.map((chunk) => (
                          <div className="chunk-card" key={chunk.chunkIndex}>
                            <div>
                              <strong>Chunk {chunk.chunkNumber}</strong>
                              <div className="small text-muted">
                                {chunk.characterCount.toLocaleString()} characters
                              </div>
                              <div className="small chunk-preview">
                                {chunk.preview}
                              </div>
                            </div>

                            <div className="d-flex gap-2 mt-2">
                              <button
                                className="btn btn-sm btn-primary"
                                type="button"
                                onClick={() =>
                                  loadChunkIntoTextBox(
                                    file.uploadId,
                                    chunk.chunkIndex,
                                    file.fileName,
                                    chunk.chunkNumber
                                  )
                                }
                                disabled={isLoadingChunk}
                              >
                                Use
                              </button>

                              <button
                                className="btn btn-sm btn-outline-primary"
                                type="button"
                                onClick={() =>
                                  appendChunkToTextBox(
                                    file.uploadId,
                                    chunk.chunkIndex,
                                    file.fileName,
                                    chunk.chunkNumber
                                  )
                                }
                                disabled={isLoadingChunk}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
            <div className="d-flex justify-content-between align-items-center gap-3">
              <label className="form-label mb-0">Lecture text sent to AI</label>

              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={clearLectureText}
                disabled={!lectureText}
              >
                Clear text
              </button>
            </div>

            <textarea
              className="form-control mt-2"
              rows="12"
              value={lectureText}
              onChange={(event) => setLectureText(event.target.value)}
              placeholder="Upload a file above, choose a chunk, or paste lecture notes here..."
            />

            <div className="small text-muted mt-2">
              {lectureText.trim().length.toLocaleString()} characters
              {lectureText.trim().length > 80000
                ? " • only the first 80,000 characters will be sent to AI"
                : ""}
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={
              isGenerating ||
              isExtractingFile ||
              isLoadingChunk ||
              lectureText.trim().length < 50
            }
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
