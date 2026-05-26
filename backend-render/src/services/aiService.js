const OpenAI = require("openai");
const {
  extractJsonObject,
  normaliseGeneratedTopic
} = require("../utils/safeJson");

const REVISION_TOPIC_SCHEMA_PROMPT = `
You are an AI revision assistant for a student revision website.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
Do not wrap the JSON in code fences.
Do not invent facts not supported by the lecture text.
Keep JSON simple. Use normal double-quoted JSON strings only.
Do not put unescaped quotes inside strings.
Do not use trailing commas.
Do not use comments.
Make the content exam-focused and useful.

Limits per chunk:
- max 10 flashcards
- max 6 multiple choice questions
- max 8 glossary terms
- max 6 notes

Return this exact structure:
{
  "topicId": "",
  "topicName": "",
  "summary": "",
  "notes": [
    {
      "heading": "",
      "content": ""
    }
  ],
  "flashcards": [
    {
      "flashcardId": "",
      "question": "",
      "answer": "",
      "difficulty": "medium",
      "tags": [],
      "score": 0,
      "correctCount": 0,
      "incorrectCount": 0,
      "lastReviewed": null
    }
  ],
  "quizQuestions": [
    {
      "questionId": "",
      "question": "",
      "type": "multiple_choice",
      "options": ["", "", "", ""],
      "answer": "",
      "explanation": "",
      "difficulty": "medium",
      "tags": []
    }
  ],
  "glossary": [
    {
      "term": "",
      "definition": ""
    }
  ],
  "sourceFiles": []
}
`;

function getProvider() {
  return String(process.env.AI_PROVIDER || "openai").toLowerCase();
}

async function callOpenAIJson({ prompt }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("[PROVIDER_001_MISSING_OPENAI_KEY] Missing OPENAI_API_KEY.");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const response = await client.responses.create({
    model,
    input: prompt,
    text: {
      format: {
        type: "json_object"
      }
    }
  });

  return response.output_text;
}

async function callGeminiJson({ prompt }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("[PROVIDER_002_MISSING_GEMINI_KEY] Missing GEMINI_API_KEY.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 8192
      }
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`[PROVIDER_003_GEMINI_REQUEST_FAILED] ${payload?.error?.message || "Gemini request failed."}`);
  }

  return payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callAIJson({ prompt }) {
  if (getProvider() === "gemini") {
    return callGeminiJson({ prompt });
  }

  return callOpenAIJson({ prompt });
}

async function generateTopicFromChunk({
  chunk,
  topicName,
  fileName,
  chunkIndex,
  totalChunks
}) {
  const prompt = `
${REVISION_TOPIC_SCHEMA_PROMPT}

Topic name requested: ${topicName}
Source file: ${fileName}
Chunk: ${chunkIndex + 1} of ${totalChunks}

Lecture text:
${chunk}
`;

  const raw = await callAIJson({ prompt });

  try {
    const parsed = extractJsonObject(raw);
    return normaliseGeneratedTopic(parsed, topicName);
  } catch (error) {
    throw new Error(`[AI_JSON_010_CHUNK_PARSE_FAILED] ${error.message}`);
  }
}

function uniqueByQuestion(cards) {
  const seen = new Set();

  return cards.filter((card) => {
    const key = String(card.question || "").trim().toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueGlossary(glossary) {
  const seen = new Set();

  return glossary.filter((item) => {
    const term = typeof item === "string" ? item : item?.term;
    const key = String(term || "").trim().toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function mergeChunkTopics({ topics, topicName, fileName }) {
  const mergedRaw = {
    topicId:
      String(topicName || "ai-topic")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${Date.now()}`,
    topicName,
    summary: topics
      .map((topic, index) => `Part ${index + 1}: ${topic.summary || ""}`)
      .join("\n\n")
      .trim(),
    notes: topics.flatMap((topic) => topic.notes || []),
    flashcards: uniqueByQuestion(topics.flatMap((topic) => topic.flashcards || [])),
    quizQuestions: uniqueByQuestion(
      topics.flatMap((topic) => topic.quizQuestions || [])
    ),
    glossary: uniqueGlossary(topics.flatMap((topic) => topic.glossary || [])),
    sourceFiles: [fileName]
  };

  if (topics.length < 4) {
    return normaliseGeneratedTopic(mergedRaw, topicName);
  }

  const prompt = `
${REVISION_TOPIC_SCHEMA_PROMPT}

Merge this generated draft into one clean revision topic.
Remove duplicates.
Keep the strongest exam-focused items.
Return valid JSON only.

Draft:
${JSON.stringify(mergedRaw)}
`;

  const raw = await callAIJson({ prompt });

  try {
    const parsed = extractJsonObject(raw);
    return {
      ...normaliseGeneratedTopic(parsed, topicName),
      sourceFiles: [fileName]
    };
  } catch (error) {
    throw new Error(`[AI_JSON_020_MERGE_PARSE_FAILED] ${error.message}`);
  }
}

async function generateTopicFromText({
  textChunks,
  topicName,
  fileName,
  onProgress
}) {
  if (!textChunks.length) {
    throw new Error("[AI_TEXT_001_NO_CHUNKS] No text could be extracted from the file.");
  }

  const generatedTopics = [];

  for (let index = 0; index < textChunks.length; index += 1) {
    if (onProgress) {
      onProgress({
        progress: Math.round((index / textChunks.length) * 70) + 15,
        message: `Generating content from chunk ${index + 1} of ${textChunks.length}`
      });
    }

    const chunkTopic = await generateTopicFromChunk({
      chunk: textChunks[index],
      topicName,
      fileName,
      chunkIndex: index,
      totalChunks: textChunks.length
    });

    generatedTopics.push(chunkTopic);
  }

  if (onProgress) {
    onProgress({
      progress: 88,
      message: "Merging generated content..."
    });
  }

  const merged = await mergeChunkTopics({
    topics: generatedTopics,
    topicName,
    fileName
  });

  if (onProgress) {
    onProgress({
      progress: 100,
      message: "Complete"
    });
  }

  return merged;
}

module.exports = {
  generateTopicFromText
};
