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

function prepareSubjectRow(userId, subject) {
  return {
    user_id: userId,
    subject_id: subject.subjectId,
    subject_name: subject.subjectName || "Untitled subject",
    subject: {
      ...subject,
      updatedAt: new Date().toISOString(),
    },
  };
}

async function seedStarterSubjectsForCurrentUser() {
  const user = await requireUser();

  const rows = subjectManifest.map((subject) =>
    prepareSubjectRow(user.id, {
      ...subject,
      subjectId: `${subject.subjectId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );

  if (rows.length === 0) {
    return [];
  }

  const { error } = await supabase.from("subjects").insert(rows);

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not create starter subjects."));
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

  const { data, error } = await supabase
    .from("subjects")
    .select("subject")
    .order("subject_name", { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not load your subjects."));
  }

  return (data || []).map((row) => row.subject);
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

  if (!subjects.length) {
    return [];
  }

  const rows = subjects.map((subject) => prepareSubjectRow(user.id, subject));

  const { error: insertError } = await supabase.from("subjects").insert(rows);

  if (insertError) {
    throw new Error(formatSupabaseError(insertError, "Could not save your subjects."));
  }

  return fetchSubjects();
}

export async function saveSubject(subject) {
  const user = await requireUser();

  const { error } = await supabase
    .from("subjects")
    .upsert(prepareSubjectRow(user.id, subject), {
      onConflict: "user_id,subject_id",
    });

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not save this subject."));
  }

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
