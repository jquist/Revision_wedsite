import { supabase } from "./supabaseClient";

let ensuredProfileForUserId = null;

function stripInternalSubjectFields(subject) {
  const { _sharing, _rowId, ...safeSubject } = subject || {};
  return safeSubject;
}

function rowToSubject(row, access = {}) {
  const subject = stripInternalSubjectFields(row.subject || {});
  return {
    ...subject,
    subjectId: subject.subjectId || row.subject_id,
    subjectName: subject.subjectName || row.subject_name,
    description: subject.description || row.description || "",
    _rowId: row.id,
    _sharing: {
      ownerId: row.user_id,
      role: access.role || "owner",
      isOwner: Boolean(access.isOwner),
      ownerName: access.ownerName || "",
      ownerEmail: access.ownerEmail || "",
    },
  };
}

function subjectToRow(subject, ownerId) {
  const safeSubject = stripInternalSubjectFields(subject);

  return {
    user_id: ownerId,
    subject_id: safeSubject.subjectId,
    subject_name: safeSubject.subjectName,
    description: safeSubject.description || "",
    summary: safeSubject.summary || "",
    subject: safeSubject,
    updated_at: new Date().toISOString(),
  };
}

function profileLabel(profile) {
  if (!profile) return "Unknown user";
  return profile.display_name || profile.username || profile.email || "Unknown user";
}

function cleanLookupTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function getProfileFromMap(profileMap, userId) {
  return profileMap.get(userId) || null;
}

async function fetchProfilesByIds(userIds) {
  const cleanIds = [...new Set((userIds || []).filter(Boolean))];
  if (cleanIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,username,updated_at")
    .in("id", cleanIds);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
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
  ensuredProfileForUserId = null;
}

export async function ensureUserProfile(userArg) {
  const user = userArg || await getCurrentUser();
  if (!user) return null;

  if (ensuredProfileForUserId === user.id) {
    return user;
  }

  const email = cleanLookupTerm(user.email);
  const fallbackName = email ? email.split("@")[0] : "Revision user";
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || fallbackName;
  const metadataUsername = cleanLookupTerm(user.user_metadata?.username || "");
  const safeMetadataUsername = /^[a-z0-9_]{3,24}$/.test(metadataUsername) ? metadataUsername : null;

  const profilePatch = {
    id: user.id,
    email,
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  if (safeMetadataUsername) {
    profilePatch.username = safeMetadataUsername;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(profilePatch, { onConflict: "id" });

  if (error && profilePatch.username) {
    // A signup username is only convenience metadata. If it has since been taken,
    // still create the profile so the user can choose a new username in settings.
    delete profilePatch.username;
    const { error: retryError } = await supabase
      .from("profiles")
      .upsert(profilePatch, { onConflict: "id" });
    if (retryError) throw retryError;
  } else if (error) {
    throw error;
  }

  ensuredProfileForUserId = user.id;
  return user;
}

async function requireUser({ ensureProfile = false } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You need to be logged in first.");
  }

  if (ensureProfile) {
    await ensureUserProfile(user);
  }

  return user;
}

export async function fetchCurrentProfile() {
  const user = await requireUser({ ensureProfile: true });

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,username,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCurrentProfile({ username, displayName }) {
  await requireUser({ ensureProfile: true });
  const cleanUsername = String(username || "").trim().toLowerCase();

  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
    throw new Error("Usernames must be 3-24 characters and can only use lowercase letters, numbers, and underscores.");
  }

  const { data, error } = await supabase.rpc("update_my_profile", {
    profile_username: cleanUsername,
    profile_display_name: String(displayName || "").trim(),
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchSubjects() {
  const user = await requireUser();

  try {
    await ensureUserProfile(user);
  } catch (profileError) {
    // If the new friends schema has not been applied yet, do not block the whole app.
    // The Friends page will show the real migration error when opened.
  }

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const { data: collaboratorRows, error: collaboratorError } = await supabase
    .from("subject_collaborators")
    .select("id,owner_id,subject_id,collaborator_id,role,created_at")
    .or(`owner_id.eq.${user.id},collaborator_id.eq.${user.id}`);

  const safeCollaborators = collaboratorError ? [] : (collaboratorRows || []);
  const collaboratorMap = new Map(
    safeCollaborators.map((share) => [`${share.owner_id}:${share.subject_id}`, share])
  );

  let profileMap = new Map();
  try {
    profileMap = await fetchProfilesByIds(rows.map((row) => row.user_id));
  } catch (profileError) {
    profileMap = new Map();
  }

  return rows.map((row) => {
    const isOwner = row.user_id === user.id;
    const share = collaboratorMap.get(`${row.user_id}:${row.subject_id}`);
    const ownerProfile = getProfileFromMap(profileMap, row.user_id);

    return rowToSubject(row, {
      isOwner,
      role: isOwner ? "owner" : share?.role || "viewer",
      ownerName: profileLabel(ownerProfile),
      ownerEmail: ownerProfile?.email || "",
    });
  });
}

export async function createSubject(subject) {
  const user = await requireUser({ ensureProfile: true });
  const row = subjectToRow(subject, user.id);
  row.created_at = new Date().toISOString();

  const { error } = await supabase.from("subjects").insert(row);
  if (error) throw error;
  return fetchSubjects();
}

export async function saveSubject(subject) {
  const user = await requireUser({ ensureProfile: true });
  const ownerId = subject?._sharing?.ownerId || user.id;
  const role = subject?._sharing?.role || "owner";
  const row = subjectToRow(subject, ownerId);

  if (ownerId !== user.id) {
    if (role !== "editor") {
      throw new Error("This subject is shared as view-only, so it cannot be edited.");
    }

    const { error } = await supabase
      .from("subjects")
      .update(row)
      .eq("user_id", ownerId)
      .eq("subject_id", subject.subjectId);

    if (error) throw error;
    return fetchSubjects();
  }

  const { error } = await supabase
    .from("subjects")
    .upsert(row, { onConflict: "user_id,subject_id" });

  if (error) throw error;
  return fetchSubjects();
}

export async function deleteSubject(subjectOrSubjectId) {
  const user = await requireUser({ ensureProfile: true });
  const subjectId = typeof subjectOrSubjectId === "string" ? subjectOrSubjectId : subjectOrSubjectId?.subjectId;
  const sharing = typeof subjectOrSubjectId === "string" ? null : subjectOrSubjectId?._sharing;

  if (!subjectId) {
    throw new Error("Missing subject ID.");
  }

  if (sharing && sharing.ownerId && sharing.ownerId !== user.id) {
    const { error } = await supabase
      .from("subject_collaborators")
      .delete()
      .eq("owner_id", sharing.ownerId)
      .eq("subject_id", subjectId)
      .eq("collaborator_id", user.id);

    if (error) throw error;
    return fetchSubjects();
  }

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", user.id)
    .eq("subject_id", subjectId);

  if (error) throw error;
  return fetchSubjects();
}

export async function saveAllSubjects(subjects) {
  const user = await requireUser({ ensureProfile: true });
  const ownSubjects = (subjects || []).filter((subject) => {
    const ownerId = subject?._sharing?.ownerId || user.id;
    return ownerId === user.id;
  });

  const { error: deleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  if (ownSubjects.length > 0) {
    const rows = ownSubjects.map((subject) => subjectToRow(subject, user.id));
    const { error: insertError } = await supabase.from("subjects").insert(rows);
    if (insertError) throw insertError;
  }

  return fetchSubjects();
}

export async function findProfileForSharing(searchTerm) {
  const user = await requireUser({ ensureProfile: true });
  const cleanTerm = String(searchTerm || "").trim();

  if (!cleanTerm) {
    throw new Error("Enter a friend's email or username.");
  }

  const { data, error } = await supabase.rpc("find_profile_for_sharing", {
    search_term: cleanTerm,
  });

  if (error) throw error;
  const profile = Array.isArray(data) ? data[0] : data;

  if (!profile) {
    throw new Error("Could not find a user with that email or username. They may need to log in once first.");
  }

  if (profile.id === user.id) {
    throw new Error("You cannot add or share with yourself.");
  }

  return profile;
}

export async function fetchFriendData() {
  const user = await requireUser({ ensureProfile: true });

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,display_name,username")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;

  const { data: requestRows, error: requestError } = await supabase
    .from("friend_requests")
    .select("id,requester_id,receiver_id,status,created_at,responded_at")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (requestError) throw requestError;

  const rows = requestRows || [];
  const profileMap = await fetchProfilesByIds(
    rows.flatMap((request) => [request.requester_id, request.receiver_id])
  );

  const withProfiles = rows.map((request) => ({
    ...request,
    requester: getProfileFromMap(profileMap, request.requester_id),
    receiver: getProfileFromMap(profileMap, request.receiver_id),
  }));

  return {
    currentProfile,
    incoming: withProfiles.filter((request) => request.receiver_id === user.id && request.status === "pending"),
    outgoing: withProfiles.filter((request) => request.requester_id === user.id && request.status === "pending"),
    friends: withProfiles.filter((request) => request.status === "accepted"),
  };
}

export async function sendFriendRequest(searchTerm) {
  const user = await requireUser({ ensureProfile: true });
  const targetProfile = await findProfileForSharing(searchTerm);

  const { data: existing, error: existingError } = await supabase
    .from("friend_requests")
    .select("id,status,requester_id,receiver_id")
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},receiver_id.eq.${user.id})`)
    .limit(1);

  if (existingError) throw existingError;

  if ((existing || []).length > 0) {
    const current = existing[0];
    if (current.status === "accepted") {
      throw new Error("You are already friends with this user.");
    }
    throw new Error("A friend request already exists between you and this user.");
  }

  const { error } = await supabase.from("friend_requests").insert({
    requester_id: user.id,
    receiver_id: targetProfile.id,
    status: "pending",
  });

  if (error) throw error;
  return fetchFriendData();
}

export async function respondFriendRequest(requestId, status) {
  await requireUser({ ensureProfile: true });
  const nextStatus = status === "accepted" ? "accepted" : "declined";

  const { error } = await supabase
    .from("friend_requests")
    .update({
      status: nextStatus,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) throw error;
  return fetchFriendData();
}

export async function shareSubjectWithUser({ subjectId, target, role }) {
  const user = await requireUser({ ensureProfile: true });
  const cleanRole = role === "editor" ? "editor" : role === "copy" ? "copy" : "viewer";
  const targetProfile = await findProfileForSharing(target);

  if (!subjectId) {
    throw new Error("Choose a subject to share.");
  }

  if (cleanRole === "copy") {
    const { error } = await supabase.rpc("copy_subject_to_user", {
      source_subject_id: subjectId,
      target_user_id: targetProfile.id,
    });

    if (error) throw error;

    return {
      copied: true,
      targetProfile,
      shares: await fetchSubjectShares(subjectId),
    };
  }

  const { error } = await supabase
    .from("subject_collaborators")
    .upsert(
      {
        owner_id: user.id,
        subject_id: subjectId,
        collaborator_id: targetProfile.id,
        role: cleanRole,
      },
      { onConflict: "owner_id,subject_id,collaborator_id" }
    );

  if (error) throw error;
  return {
    copied: false,
    targetProfile,
    shares: await fetchSubjectShares(subjectId),
  };
}

export async function fetchSubjectShares(subjectId) {
  const user = await requireUser({ ensureProfile: true });

  if (!subjectId) return [];

  const { data, error } = await supabase
    .from("subject_collaborators")
    .select("id,owner_id,subject_id,collaborator_id,role,created_at")
    .eq("owner_id", user.id)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const profileMap = await fetchProfilesByIds(rows.map((share) => share.collaborator_id));

  return rows.map((share) => ({
    ...share,
    collaborator: getProfileFromMap(profileMap, share.collaborator_id),
  }));
}

export async function removeSubjectShare(shareId) {
  await requireUser({ ensureProfile: true });

  const { error } = await supabase
    .from("subject_collaborators")
    .delete()
    .eq("id", shareId);

  if (error) throw error;
  return true;
}


export async function isCurrentUserAdmin() {
  await requireUser({ ensureProfile: true });

  const { data, error } = await supabase.rpc("is_current_user_admin");
  if (error) throw error;
  return Boolean(data);
}

export async function fetchAdminDashboard() {
  await requireUser({ ensureProfile: true });

  const { data, error } = await supabase.rpc("get_admin_dashboard");
  if (error) throw error;
  return data || {};
}

export async function submitBetaInterest(payload) {
  const email = cleanLookupTerm(payload?.email || "");
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailLooksValid) {
    throw new Error("Enter a valid email address so interest can be followed up later.");
  }

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (authError) {
    user = null;
  }

  const row = {
    email,
    name: String(payload?.name || "").trim() || null,
    role: String(payload?.role || "student").trim() || "student",
    subjects: String(payload?.subjects || "").trim() || null,
    wanted_plan: String(payload?.wantedPlan || "free-beta").trim() || "free-beta",
    notes: String(payload?.notes || "").trim() || null,
    source: "pricing_page",
    user_id: user?.id || null,
  };

  const { error } = await supabase.from("beta_interest").insert(row);

  if (error) {
    throw new Error(
      "Could not save the interest form. Make sure the latest supabase/schema.sql has been run, or email griffingroveproductions@gmail.com instead."
    );
  }

  return true;
}
