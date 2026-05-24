const path = require("path");
const AdmZip = require("adm-zip");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

function cleanExtractedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function xmlDecode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function extractPptxTextWithOfficeParser(buffer) {
  try {
    const officeParser = require("officeparser");

    const text = await officeParser.parseOfficeAsync(buffer);
    return cleanExtractedText(text);
  } catch (error) {
    return "";
  }
}

/**
 * Fallback PPTX extraction:
 * PPTX files are zip files with slide XML. This pulls text from <a:t> tags.
 */
function extractPptxTextFallback(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const slideEntries = entries
    .filter((entry) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)
    )
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, {
      numeric: true
    }));

  const slideTexts = slideEntries.map((entry, index) => {
    const xml = entry.getData().toString("utf8");
    const matches = [...xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)];

    const text = matches
      .map((match) => xmlDecode(match[1]))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return text ? `Slide ${index + 1}: ${text}` : "";
  });

  return cleanExtractedText(slideTexts.filter(Boolean).join("\n\n"));
}

async function extractTextFromFile({ buffer, fileName, mimeType }) {
  const extension = path.extname(fileName || "").toLowerCase();

  if (extension === ".txt" || mimeType === "text/plain") {
    return cleanExtractedText(buffer.toString("utf8"));
  }

  if (extension === ".pdf" || mimeType === "application/pdf") {
    const parsed = await pdfParse(buffer);
    return cleanExtractedText(parsed.text);
  }

  if (
    extension === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanExtractedText(result.value);
  }

  if (
    extension === ".pptx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    const officeParserText = await extractPptxTextWithOfficeParser(buffer);

    if (officeParserText) {
      return officeParserText;
    }

    return extractPptxTextFallback(buffer);
  }

  throw new Error(`Unsupported file type: ${extension || mimeType || "unknown"}`);
}

function chunkText(text, maxChars = 12000) {
  const cleaned = cleanExtractedText(text);

  if (!cleaned) {
    return [];
  }

  const paragraphs = cleaned.split(/\n\s*\n/g);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;

    if (next.length > maxChars && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }

  if (current.trim()) {
    chunks.push(current);
  }

  return chunks;
}

module.exports = {
  extractTextFromFile,
  chunkText,
  cleanExtractedText
};
