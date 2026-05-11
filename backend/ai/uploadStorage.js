const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATA_DIR = path.join(__dirname, "..", "data");
const USER_DATA_DIR = path.join(DATA_DIR, "user-data");

const CHUNK_SIZE = 20000;
const SMALL_TEXT_LIMIT = 80000;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getUserUploadsDir(userId) {
  return path.join(USER_DATA_DIR, userId, "uploads");
}

function getUploadDir(userId, uploadId) {
  return path.join(getUserUploadsDir(userId), uploadId);
}

function getChunksDir(userId, uploadId) {
  return path.join(getUploadDir(userId, uploadId), "chunks");
}

function splitTextIntoChunks(text, chunkSize = CHUNK_SIZE) {
  const cleaned = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const nextBreak = cleaned.lastIndexOf("\n\n", end);
      const nextSentence = cleaned.lastIndexOf(". ", end);

      if (nextBreak > start + chunkSize * 0.5) {
        end = nextBreak;
      } else if (nextSentence > start + chunkSize * 0.5) {
        end = nextSentence + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    start = end;
  }

  return chunks;
}

function saveExtractedTextAsUpload({ userId, fileName, text }) {
  const uploadId = uuidv4();
  const uploadDir = getUploadDir(userId, uploadId);
  const chunksDir = getChunksDir(userId, uploadId);

  ensureDir(uploadDir);
  ensureDir(chunksDir);

  const chunks = splitTextIntoChunks(text);
  const chunkMetadata = chunks.map((chunk, index) => {
    const chunkNumber = index + 1;
    const chunkFileName = `chunk-${String(chunkNumber).padStart(3, "0")}.txt`;

    fs.writeFileSync(path.join(chunksDir, chunkFileName), chunk, "utf8");

    return {
      chunkIndex: index,
      chunkNumber,
      fileName: chunkFileName,
      characterCount: chunk.length,
      preview: chunk.slice(0, 350)
    };
  });

  const metadata = {
    uploadId,
    originalFileName: fileName,
    uploadedAt: new Date().toISOString(),
    totalCharacterCount: text.length,
    chunkSize: CHUNK_SIZE,
    chunkCount: chunks.length,
    chunks: chunkMetadata
  };

  fs.writeFileSync(
    path.join(uploadDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  return metadata;
}

function getUploadMetadata(userId, uploadId) {
  const metadataPath = path.join(getUploadDir(userId, uploadId), "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    throw new Error("Upload not found.");
  }

  return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
}

function getUploadChunkText(userId, uploadId, chunkIndex) {
  const metadata = getUploadMetadata(userId, uploadId);
  const chunk = metadata.chunks[Number(chunkIndex)];

  if (!chunk) {
    throw new Error("Chunk not found.");
  }

  const chunkPath = path.join(getChunksDir(userId, uploadId), chunk.fileName);

  if (!fs.existsSync(chunkPath)) {
    throw new Error("Chunk file not found.");
  }

  return {
    metadata,
    chunk,
    text: fs.readFileSync(chunkPath, "utf8")
  };
}

module.exports = {
  CHUNK_SIZE,
  SMALL_TEXT_LIMIT,
  getUploadChunkText,
  saveExtractedTextAsUpload,
  splitTextIntoChunks
};
