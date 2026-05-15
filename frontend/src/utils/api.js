import { subjectManifest } from "../data/subjectManifest";
import { supabase } from "./supabaseClient";

function formatSupabaseError(error, fallbackMessage = "Something went wrong.") {
  if (!error) {
    return fallbackMessage;
  }

  return error.message || fallbackMessage;
}

function mapUser(user) {
  if (!user) {
    return null;
  }

  const email = user.email || "";

  return {
    userId: user.id,
    email,
    username: email ? email.split("@")[0] : "User",
  };
}

async function getSupabaseUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not read the current user."));
  }

  return data.user;
}

async function requireUser() {
  const user = await getSupabaseUser();

  if (!user) {
    throw new Error("Please log in again.");
  }

  return user;
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function makeIdFromText(value, fallback) {
  const clean = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return clean || fallback;
}

function stableOptionId(questionId, optionText, index) {
  return `${questionId}-opt-${makeIdFromText(optionText, index + 1)}`;
}

function normalizeQuizOptions(question) {
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const questionId = question.questionId || question.id || `q-${Date.now()}`;

  return rawOptions.map((option, index) => {
    if (typeof option === "string") {
      return {
        optionId: stableOptionId(questionId, option, index),
        text: option,
      };
    }

    const text = String(option?.text || option?.label || option?.answer || "").trim();

    return {
      ...option,
      optionId:
        option?.optionId ||
        option?.id ||
        stableOptionId(questionId, text || `option-${index + 1}`, index),
      text,
    };
  });
}

function normalizeQuizQuestion(question, index) {
  const questionId = question.questionId || question.id || `q-${Date.now()}-${index}`;
  const options = normalizeQuizOptions({ ...question, questionId });
  const oldCorrectText = question.correctAnswer || question.answer || "";

  let correctOptionId =
    question.correctOptionId || question.correct_option_id || question.correct_option || "";

  if (!correctOptionId && oldCorrectText) {
    const matchingOption = options.find((option) => option.text === oldCorrectText);
    correctOptionId = matchingOption?.optionId || "";
  }

  const correctText =
    options.find((option) => option.optionId === correctOptionId)?.text || oldCorrectText;

  return {
    ...question,
    questionId,
    options,
    correctOptionId,
    // Keep this for older parts of the app / old JSON files.
    correctAnswer: correctText,
  };
}

function normalizeTopic(topic, index = 0) {
  const topicName = topic.topicName || topic.title || `Topic ${index + 1}`;
  const topicId = topic.topicId || topic.id || makeIdFromText(topicName, `topic-${index + 1}`);

  return {
    topicId,
    topicName,
    sourceFiles: topic.sourceFiles || topic.source_files || [],
    summary: topic.summary || topic.description || "",
    notes: topic.notes || topic.revision_notes || topic.revisionNotes || [],
    flashcards: topic.flashcards || [],
    quizQuestions: (topic.quizQuestions || topic.quiz_questions || []).map(normalizeQuizQuestion),
    glossary: topic.glossary || [],
  };
}

function prepareSubjectRow(userId, subject) {
  const now = new Date().toISOString();
  const updatedSubject = {
    ...subject,
    // Keep the legacy JSON small so Supabase no longer has one massive topics blob.
    topics: [],
    updatedAt: now,
  };

  return {
    user_id: userId,
    subject_id: subject.subjectId,
    subject_name: subject.subjectName || "Untitled subject",
    description: subject.description || subject.summary || "",
    summary: subject.summary || subject.description || "",
    subject: updatedSubject,
  };
}

function prepareTopicRow({ userId, subjectDatabaseId, topic, index }) {
  const normalizedTopic = normalizeTopic(topic, index);

  return {
    user_id: userId,
    subject_id: subjectDatabaseId,
    topic_id: normalizedTopic.topicId,
    topic_name: normalizedTopic.topicName,
    summary: normalizedTopic.summary || "",
    source_files: normalizedTopic.sourceFiles || [],
    notes: normalizedTopic.notes || [],
    flashcards: normalizedTopic.flashcards || [],
    quiz_questions: normalizedTopic.quizQuestions || [],
    glossary: normalizedTopic.glossary || [],
    position: index,
  };
}

function topicRowToTopic(row) {
  return normalizeTopic({
    topicId: row.topic_id,
    topicName: row.topic_name,
    sourceFiles: row.source_files || [],
    summary: row.summary || "",
    notes: row.notes || [],
    flashcards: row.flashcards || [],
    quizQuestions: row.quiz_questions || [],
    glossary: row.glossary || [],
  });
}

function subjectRowToSubject(subjectRow, topicRows = []) {
  const legacySubject = subjectRow.subject || {};
  const topicsFromRows = (topicRows || []).map(topicRowToTopic);
  const legacyTopics = (legacySubject.topics || []).map(normalizeTopic);

  return {
    ...legacySubject,
    subjectId: subjectRow.subject_id || legacySubject.subjectId,
    subjectName:
      subjectRow.subject_name || legacySubject.subjectName || "Untitled subject",
    description:
      subjectRow.description ||
      legacySubject.description ||
      subjectRow.summary ||
      legacySubject.summary ||
      "",
    summary: subjectRow.summary || legacySubject.summary || subjectRow.description || "",
    createdAt: toIsoDate(subjectRow.created_at || legacySubject.createdAt),
    updatedAt: toIsoDate(subjectRow.updated_at || legacySubject.updatedAt),
    topics: topicsFromRows.length > 0 ? topicsFromRows : legacyTopics,
  };
}

async function syncTopicsForSubject({ userId, subjectDatabaseId, topics }) {
  const { error: deleteError } = await supabase
    .from("topics")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectDatabaseId);

  if (deleteError) {
    throw new Error(formatSupabaseError(deleteError, "Could not update this subject's topics."));
  }

  const rows = (topics || []).map((topic, index) =>
    prepareTopicRow({ userId, subjectDatabaseId, topic, index })
  );

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("topics").insert(rows);

  if (insertError) {
    throw new Error(formatSupabaseError(insertError, "Could not save this subject's topics."));
  }
}

async function saveSubjectRows(user, subject) {
  const { data, error } = await supabase
    .from("subjects")
    .upsert(prepareSubjectRow(user.id, subject), {
      onConflict: "user_id,subject_id",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not save this subject."));
  }

  await syncTopicsForSubject({
    userId: user.id,
    subjectDatabaseId: data.id,
    topics: subject.topics || [],
  });
}

async function seedStarterSubjectsForCurrentUser() {
  const user = await requireUser();

  for (const subject of subjectManifest) {
    await saveSubjectRows(user, {
      ...subject,
      subjectId: `${subject.subjectId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return fetchSubjects();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not read the saved session."));
  }

  return mapUser(data.session?.user || null);
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(mapUser(session?.user || null));
  });

  return () => data.subscription.unsubscribe();
}

export async function clearSession() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not log out."));
  }
}

export async function registerUser({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error("Please enter an email and password.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not create your account."));
  }

  if (!data.session) {
    return {
      user: null,
      needsEmailConfirmation: true,
      message:
        "Account created. Check your email to confirm it, then come back and log in.",
    };
  }

  await seedStarterSubjectsForCurrentUser();

  return {
    user: mapUser(data.user),
  };
}

export async function loginUser({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error("Please enter an email and password.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw new Error(formatSupabaseError(error, "Email or password is incorrect."));
  }

  return {
    user: mapUser(data.user),
  };
}

export async function fetchSubjects() {
  await requireUser();

  const { data: subjectRows, error: subjectError } = await supabase
    .from("subjects")
    .select("id,user_id,subject_id,subject_name,description,summary,subject,created_at,updated_at")
    .order("subject_name", { ascending: true });

  if (subjectError) {
    throw new Error(formatSupabaseError(subjectError, "Could not load your subjects."));
  }

  if (!subjectRows?.length) {
    return [];
  }

  const subjectDatabaseIds = subjectRows.map((row) => row.id);

  const { data: topicRows, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .in("subject_id", subjectDatabaseIds)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (topicError) {
    throw new Error(formatSupabaseError(topicError, "Could not load your topics."));
  }

  const topicsBySubjectDatabaseId = new Map();

  for (const topicRow of topicRows || []) {
    const currentRows = topicsBySubjectDatabaseId.get(topicRow.subject_id) || [];
    currentRows.push(topicRow);
    topicsBySubjectDatabaseId.set(topicRow.subject_id, currentRows);
  }

  return subjectRows.map((subjectRow) =>
    subjectRowToSubject(
      subjectRow,
      topicsBySubjectDatabaseId.get(subjectRow.id) || []
    )
  );
}

export async function saveAllSubjects(subjects) {
  const user = await requireUser();

  const { error: deleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(formatSupabaseError(deleteError, "Could not clear your subjects."));
  }

  for (const subject of subjects || []) {
    await saveSubjectRows(user, subject);
  }

  return fetchSubjects();
}

export async function saveSubject(subject) {
  const user = await requireUser();

  await saveSubjectRows(user, subject);

  return fetchSubjects();
}

export async function createSubject(subject) {
  return saveSubject(subject);
}

export async function deleteSubject(subjectId) {
  await requireUser();

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("subject_id", subjectId);

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not delete this subject."));
  }

  return fetchSubjects();
}
