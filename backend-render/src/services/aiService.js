const OpenAI = require("openai");
const {
  extractJsonObject,
  normaliseGeneratedTopic
} = require("../utils/safeJson");

const SUPPORTED_QUESTION_TYPES = [
  "single_choice",
  "multi_select",
  "written",
  "fill_blank",
  "matching",
  "ordering",
  "true_false"
];

const QUESTION_TYPE_LABELS = {
  single_choice: "single-choice multiple choice",
  multi_select: "multi-select / select all that apply",
  written: "written answer / typed response",
  fill_blank: "fill in the blank",
  matching: "matching pairs / left list to right list",
  ordering: "ordering / sequence",
  true_false: "true or false"
};

const QUESTION_TYPE_ALIASES = {
  multiple_choice: "single_choice",
  mcq: "single_choice",
  single: "single_choice",
  single_choice: "single_choice",
  multi_choice: "multi_select",
  multiple_multiple_choice: "multi_select",
  multiple_answer: "multi_select",
  multiple_answers: "multi_select",
  multi_select: "multi_select",
  select_multiple: "multi_select",
  written: "written",
  text: "written",
  text_response: "written",
  short_answer: "written",
  fill_blank: "fill_blank",
  fill_in_blank: "fill_blank",
  fill_in_the_blank: "fill_blank",
  cloze: "fill_blank",
  matching: "matching",
  match: "matching",
  match_pairs: "matching",
  ordering: "ordering",
  order: "ordering",
  sequence: "ordering",
  true_false: "true_false",
  truefalse: "true_false",
  boolean: "true_false"
};

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

Return this exact top-level structure:
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
  "quizQuestions": [],
  "glossary": [
    {
      "term": "",
      "definition": ""
    }
  ],
  "sourceFiles": []
}

Use these quiz question schemas only when that question type is enabled:

single_choice:
{
  "questionId": "",
  "type": "single_choice",
  "question": "",
  "options": ["", "", "", ""],
  "answer": "exact option text that is correct",
  "explanation": "",
  "difficulty": "medium",
  "tags": [],
  "maxMarks": 1
}

multi_select:
{
  "questionId": "",
  "type": "multi_select",
  "question": "",
  "options": ["", "", "", ""],
  "correctAnswers": ["exact option text", "exact option text"],
  "explanation": "",
  "difficulty": "medium",
  "tags": [],
  "maxMarks": 1
}

written:
{
  "questionId": "",
  "type": "written",
  "question": "",
  "expectedAnswer": "model answer in student-friendly wording",
  "markingPoints": ["clear mark scheme point", "clear mark scheme point"],
  "maxMarks": 5,
  "explanation": "",
  "difficulty": "medium",
  "tags": []
}

fill_blank:
{
  "questionId": "",
  "type": "fill_blank",
  "question": "A sentence with one ______ blank.",
  "correctAnswers": ["accepted answer", "accepted alternative"],
  "explanation": "",
  "difficulty": "medium",
  "tags": [],
  "maxMarks": 1
}

matching:
{
  "questionId": "",
  "type": "matching",
  "question": "Match each item on the left with the correct item on the right.",
  "leftItems": [{ "id": "1", "text": "" }],
  "rightItems": [{ "id": "A", "text": "" }],
  "correctMatches": { "1": "A" },
  "explanation": "",
  "difficulty": "medium",
  "tags": []
}

ordering:
{
  "questionId": "",
  "type": "ordering",
  "question": "Put these steps in the correct order.",
  "items": ["", "", ""],
  "correctOrder": ["first item text", "second item text", "third item text"],
  "explanation": "",
  "difficulty": "medium",
  "tags": []
}

true_false:
{
  "questionId": "",
  "type": "true_false",
  "question": "",
  "correctAnswer": true,
  "explanation": "",
  "difficulty": "medium",
  "tags": [],
  "maxMarks": 1
}
`;

const DETAIL_LEVELS = {
  simple: "Simple: use plain language, short answers, beginner-friendly explanations, and avoid unnecessary jargon.",
  balanced: "Balanced: use clear student-friendly wording with enough detail for revision.",
  detailed: "Detailed: include fuller explanations, examples, and key distinctions. Still keep each item focused.",
  "exam-cram": "Exam cram: prioritise definitions, distinctions, likely MCQ traps, and compact high-yield facts."
};

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function normaliseQuestionType(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return QUESTION_TYPE_ALIASES[key] || null;
}

function normaliseEnabledQuestionTypes(rawQuestionTypes) {
  if (Array.isArray(rawQuestionTypes)) {
    return rawQuestionTypes
      .map(normaliseQuestionType)
      .filter((type, index, array) => type && array.indexOf(type) === index);
  }

  if (rawQuestionTypes && typeof rawQuestionTypes === "object") {
    return SUPPORTED_QUESTION_TYPES.filter((type) => Boolean(rawQuestionTypes[type]));
  }

  return ["single_choice"];
}

function getAutomaticGlossaryTarget(detailLevel) {
  if (detailLevel === "simple") return 6;
  if (detailLevel === "detailed") return 16;
  if (detailLevel === "exam-cram") return 12;
  return 10;
}

function getAutoTargets(detailLevel) {
  if (detailLevel === "simple") {
    return {
      flashcardTarget: 12,
      quizQuestionTarget: 5,
      noteTarget: 4
    };
  }

  if (detailLevel === "detailed") {
    return {
      flashcardTarget: 32,
      quizQuestionTarget: 16,
      noteTarget: 12
    };
  }

  if (detailLevel === "exam-cram") {
    return {
      flashcardTarget: 42,
      quizQuestionTarget: 20,
      noteTarget: 8
    };
  }

  return {
    flashcardTarget: 20,
    quizQuestionTarget: 10,
    noteTarget: 7
  };
}

function normaliseContentSettings(settings = {}) {
  const detailLevel = DETAIL_LEVELS[settings.detailLevel] ? settings.detailLevel : "balanced";
  const autoTargets = settings.autoTargets !== false;
  const defaults = getAutoTargets(detailLevel);
  const enabledQuestionTypes = normaliseEnabledQuestionTypes(settings.questionTypes || settings.enabledQuestionTypes);
  const hasPracticeQuestions = enabledQuestionTypes.length > 0;
  const defaultQuizTarget = hasPracticeQuestions ? defaults.quizQuestionTarget : 0;

  return {
    detailLevel,
    detailInstruction: DETAIL_LEVELS[detailLevel],
    autoTargets,
    enabledQuestionTypes,
    questionMixMode: settings.questionMixMode === "balanced_mix" ? "balanced_mix" : "ai_decide",
    flashcardTarget: autoTargets
      ? defaults.flashcardTarget
      : clampNumber(settings.flashcardTarget, defaults.flashcardTarget, 0, 60),
    quizQuestionTarget: hasPracticeQuestions
      ? (autoTargets
        ? defaultQuizTarget
        : clampNumber(settings.quizQuestionTarget, defaultQuizTarget, 0, 40))
      : 0,
    noteTarget: autoTargets
      ? defaults.noteTarget
      : clampNumber(settings.noteTarget, defaults.noteTarget, 1, 20),
    glossaryTarget: getAutomaticGlossaryTarget(detailLevel)
  };
}

function getChunkTargets(settings, totalChunks) {
  const divisor = Math.max(1, Number(totalChunks || 1));

  return {
    flashcardTarget: Math.max(2, Math.ceil(settings.flashcardTarget / divisor) + 2),
    quizQuestionTarget: settings.quizQuestionTarget <= 0
      ? 0
      : Math.max(1, Math.ceil(settings.quizQuestionTarget / divisor) + 1),
    noteTarget: Math.max(1, Math.ceil(settings.noteTarget / divisor) + 1),
    glossaryTarget: Math.max(0, Math.ceil(settings.glossaryTarget / divisor) + 1)
  };
}

function buildQuestionTypePrompt(settings, targets) {
  if (!settings.enabledQuestionTypes.length || targets.quizQuestionTarget <= 0) {
    return `
Practice question rules:
- The user did not request practice questions for this import.
- Return "quizQuestions": [].
`;
  }

  const enabledList = settings.enabledQuestionTypes
    .map((type) => `- ${type}: ${QUESTION_TYPE_LABELS[type]}`)
    .join("\n");

  const mixInstruction = settings.questionMixMode === "balanced_mix"
    ? "Spread the practice questions across the enabled types as evenly as the source material allows."
    : "Choose the best mix from the enabled types based on what the source material is suitable for.";

  return `
Practice question rules:
- Generate practice questions ONLY from these enabled types:
${enabledList}
- Do not generate disabled question types.
- ${mixInstruction}
- Use single_choice for precise facts and definitions.
- Use multi_select when two or more options are genuinely correct.
- Use written when the student should explain, compare, justify, or describe in their own words.
- Use fill_blank for key terms, formulas, command names, and short factual recall.
- Use matching for term-to-definition, concept-to-example, or item-to-function questions.
- Use ordering for processes, pipelines, algorithms, or chronological steps.
- Use true_false sparingly for misconceptions or exam traps.
- Every option answer must use exact option text, not just A/B/C letters.
`;
}

function buildSettingsPrompt(settings, targets, scopeLabel = "this chunk") {
  const quantityInstruction = settings.autoTargets
    ? `- Quantity mode: AI decides. Choose sensible amounts for ${scopeLabel} based on how much useful revision content is present, while staying under these safety caps: ${targets.flashcardTarget} flashcards, ${targets.quizQuestionTarget} practice questions, ${targets.noteTarget} notes sections.`
    : `- Quantity mode: manual rough targets. Aim for roughly ${targets.flashcardTarget} flashcards, ${targets.quizQuestionTarget} practice questions, and ${targets.noteTarget} notes sections if the source supports them.`;

  return `
AI output settings for ${scopeLabel}:
- Detail level: ${settings.detailLevel}
- Detail instruction: ${settings.detailInstruction}
${quantityInstruction}
- Glossary: automatically include important terms that appear in or are clearly supported by the lecture text.

${buildQuestionTypePrompt(settings, targets)}

Content rules:
- If the lecture text does not support enough items, create fewer rather than inventing.
- Do not create filler just to hit a number.
- Flashcards should test useful revision facts.
- Notes should be structured as heading/content objects.
- Glossary should contain useful terms from the source text, not random extra terms.
- Keep output valid JSON only.
`;
}

function limitArray(items, count) {
  if (!Array.isArray(items)) return [];
  if (count <= 0) return [];
  return items.slice(0, count);
}

function applyContentLimits(topic, settings) {
  return {
    ...topic,
    flashcards: limitArray(topic.flashcards, settings.flashcardTarget),
    quizQuestions: limitArray(topic.quizQuestions, settings.quizQuestionTarget),
    notes: limitArray(topic.notes, settings.noteTarget),
    glossary: limitArray(topic.glossary, settings.glossaryTarget)
  };
}

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
  totalChunks,
  contentSettings
}) {
  const settings = normaliseContentSettings(contentSettings);
  const chunkTargets = getChunkTargets(settings, totalChunks);

  const prompt = `
${REVISION_TOPIC_SCHEMA_PROMPT}

${buildSettingsPrompt(settings, chunkTargets, "this chunk")}

Topic name requested: ${topicName}
Source file(s): ${fileName}
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

function normaliseSourceFiles(sourceFiles, fallbackFileName) {
  if (Array.isArray(sourceFiles) && sourceFiles.length) {
    return sourceFiles.map((file) => {
      if (typeof file === "string") return file;

      return {
        name: file?.name || file?.fileName || "Uploaded file",
        type: file?.type || file?.mimeType || "",
        size: file?.size || file?.sizeBytes || 0
      };
    });
  }

  return fallbackFileName ? [fallbackFileName] : [];
}

async function mergeChunkTopics({ topics, topicName, fileName, sourceFiles, contentSettings }) {
  const settings = normaliseContentSettings(contentSettings);
  const safeSourceFiles = normaliseSourceFiles(sourceFiles, fileName);

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
    sourceFiles: safeSourceFiles
  };

  if (topics.length < 4) {
    return applyContentLimits(normaliseGeneratedTopic(mergedRaw, topicName), settings);
  }

  const prompt = `
${REVISION_TOPIC_SCHEMA_PROMPT}

${buildSettingsPrompt(settings, settings, "the final merged topic")}

Merge this generated draft into one clean revision topic.
Remove duplicates.
Keep the strongest exam-focused items.
Keep quizQuestions only in the enabled question types and keep their schema valid.
Return valid JSON only.

Draft:
${JSON.stringify(mergedRaw)}
`;

  const raw = await callAIJson({ prompt });

  try {
    const parsed = extractJsonObject(raw);
    return applyContentLimits({
      ...normaliseGeneratedTopic(parsed, topicName),
      sourceFiles: safeSourceFiles
    }, settings);
  } catch (error) {
    throw new Error(`[AI_JSON_020_MERGE_PARSE_FAILED] ${error.message}`);
  }
}

async function generateTopicFromText({
  textChunks,
  topicName,
  fileName,
  sourceFiles,
  onProgress,
  contentSettings
}) {
  if (!textChunks.length) {
    throw new Error("[AI_TEXT_001_NO_CHUNKS] No text could be extracted from the file.");
  }

  const settings = normaliseContentSettings(contentSettings);
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
      totalChunks: textChunks.length,
      contentSettings: settings
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
    fileName,
    sourceFiles,
    contentSettings: settings
  });

  if (onProgress) {
    onProgress({
      progress: 100,
      message: "Complete"
    });
  }

  return applyContentLimits(merged, settings);
}

function normaliseMarkingResult(parsed, maxMarks) {
  const safeMax = Math.max(1, Number(maxMarks) || 5);
  const rawMarks = Number(parsed?.marksAwarded ?? parsed?.score ?? parsed?.marks ?? 0);
  const marksAwarded = Math.max(0, Math.min(safeMax, Number.isFinite(rawMarks) ? rawMarks : 0));

  return {
    marksAwarded,
    maxMarks: safeMax,
    feedback: String(parsed?.feedback || parsed?.summary || "No feedback returned."),
    correctPoints: Array.isArray(parsed?.correctPoints) ? parsed.correctPoints.map(String) : [],
    missingPoints: Array.isArray(parsed?.missingPoints) ? parsed.missingPoints.map(String) : [],
    improvementTip: String(parsed?.improvementTip || parsed?.nextStep || ""),
    confidence: String(parsed?.confidence || "medium")
  };
}

async function markWrittenAnswer({ question, expectedAnswer, markingPoints, maxMarks, userAnswer }) {
  const safeMaxMarks = Math.max(1, Math.min(20, Number(maxMarks) || 5));
  const safeMarkingPoints = Array.isArray(markingPoints) ? markingPoints.filter(Boolean) : [];

  const prompt = `
You are marking a student's typed revision-test answer.
Return ONLY valid JSON. Do not include markdown.
Be fair, useful, and concise. Award partial credit when the answer is partly correct.
Do not be overly harsh about exact wording if the meaning is correct.
Do not award marks for unsupported or clearly incorrect claims.

Return this structure:
{
  "marksAwarded": 0,
  "maxMarks": ${safeMaxMarks},
  "feedback": "short feedback for the student",
  "correctPoints": ["point the student got right"],
  "missingPoints": ["important point missed or unclear"],
  "improvementTip": "one specific way to improve",
  "confidence": "high"
}

Question:
${question}

Max marks: ${safeMaxMarks}

Expected/model answer:
${expectedAnswer || "No model answer supplied. Use the marking points and question context."}

Marking points:
${safeMarkingPoints.length ? safeMarkingPoints.map((point, index) => `${index + 1}. ${point}`).join("\n") : "No explicit marking points supplied. Mark against the expected answer."}

Student answer:
${userAnswer}
`;

  const raw = await callAIJson({ prompt });

  try {
    const parsed = extractJsonObject(raw);
    return normaliseMarkingResult(parsed, safeMaxMarks);
  } catch (error) {
    throw new Error(`[AI_MARK_010_PARSE_FAILED] ${error.message}`);
  }
}

module.exports = {
  generateTopicFromText,
  markWrittenAnswer
};
