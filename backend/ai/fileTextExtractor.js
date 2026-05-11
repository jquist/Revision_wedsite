const fs = require("fs");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const JSZip = require("jszip");

function getExtension(fileName = "") {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXmlTags(xml) {
  return decodeXmlEntities(
    xml
      .replace(/<a:br\s*\/>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function readFileBuffer(file) {
  if (file.buffer) {
    return file.buffer;
  }

  if (file.path) {
    return fs.readFileSync(file.path);
  }

  throw new Error("Could not read uploaded file.");
}

function extractPlainText(buffer) {
  return buffer.toString("utf8");
}

async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractPptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((fileName) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(fileName)
    )
    .sort((a, b) => {
      const aNum = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
      const bNum = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
      return aNum - bNum;
    });

  const slideTexts = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("text");
    const text = stripXmlTags(xml);

    if (text) {
      const slideNumber = slideFile.match(/slide(\d+)\.xml/i)?.[1] || "?";
      slideTexts.push(`Slide ${slideNumber}:\n${text}`);
    }
  }

  return slideTexts.join("\n\n");
}

async function extractTextFromUploadedFile(file) {
  if (!file) {
    throw new Error("No file uploaded.");
  }

  const extension = getExtension(file.originalname);
  const mimeType = file.mimetype || "";
  const buffer = readFileBuffer(file);

  if (!buffer || buffer.length === 0) {
    throw new Error("Uploaded file was empty.");
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(buffer);
  }

  if (
    extension === "pptx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return extractPptxText(buffer);
  }

  const textExtensions = new Set([
    "txt",
    "md",
    "csv",
    "json",
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "java",
    "html",
    "css",
    "xml",
    "sql"
  ]);

  if (textExtensions.has(extension) || mimeType.startsWith("text/")) {
    return extractPlainText(buffer);
  }

  throw new Error(
    "Unsupported file type. Try PDF, DOCX, PPTX, TXT, MD, CSV, or another plain text file."
  );
}

module.exports = {
  extractTextFromUploadedFile
};
