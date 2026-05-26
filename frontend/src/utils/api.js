import { supabase } from "./supabaseClient";

function rowToSubject(row) {
  const subject = row.subject || {};
  return {
    ...subject,
    subjectId: subject.subjectId || row.subject_id,
    subjectName: subject.subjectName || row.subject_name,
    description: subject.description || row.description || "",
  };
}

function subjectToRow(subject, userId) {
  return {
    user_id: userId,
    subject_id: subject.subjectId,
    subject_name: subject.subjectName,
    description: subject.description || "",
    summary: subject.summary || "",
    subject,
    updated_at: new Date().toISOString(),
  };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
  return () => data.subscription.unsubscribe();
}

export async function clearSession() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You need to be logged in first.");
  }
  return user;
}

export async function fetchSubjects() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToSubject);
}

export async function createSubject(subject) {
  const user = await requireUser();
  const row = subjectToRow(subject, user.id);
  row.created_at = new Date().toISOString();

  const { error } = await supabase.from("subjects").insert(row);
  if (error) throw error;
  return fetchSubjects();
}

export async function saveSubject(subject) {
  const user = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .upsert(subjectToRow(subject, user.id), { onConflict: "user_id,subject_id" });

  if (error) throw error;
  return fetchSubjects();
}

export async function deleteSubject(subjectId) {
  const user = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", user.id)
    .eq("subject_id", subjectId);

  if (error) throw error;
  return fetchSubjects();
}

export async function saveAllSubjects(subjects) {
  const user = await requireUser();
  const { error: deleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  if ((subjects || []).length > 0) {
    const rows = subjects.map((subject) => subjectToRow(subject, user.id));
    const { error: insertError } = await supabase.from("subjects").insert(rows);
    if (insertError) throw insertError;
  }

  return fetchSubjects();
}
