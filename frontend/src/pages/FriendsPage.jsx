import React, { useEffect, useMemo, useState } from "react";
import {
  fetchFriendData,
  fetchSubjectShares,
  removeSubjectShare,
  respondFriendRequest,
  sendFriendRequest,
  shareSubjectWithUser,
} from "../utils/api";

function personName(profile) {
  if (!profile) return "Unknown user";
  return profile.display_name || profile.username || profile.email || "Unknown user";
}

function personSubtext(profile) {
  if (!profile) return "";
  const parts = [];
  if (profile.email) parts.push(profile.email);
  if (profile.username) parts.push(`@${profile.username}`);
  return parts.join(" · ");
}

function getOtherPerson(request, currentUserId) {
  return request.requester_id === currentUserId ? request.receiver : request.requester;
}

function StatusMessage({ type, children }) {
  if (!children) return null;
  return <div className={`alert alert-${type} py-2 mb-3`}>{children}</div>;
}

function FriendsPage({ currentUser, subjects = [], onBackToDashboard, onSubjectsChanged }) {
  const [friendData, setFriendData] = useState(null);
  const [shares, setShares] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [shareTarget, setShareTarget] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const ownSubjects = useMemo(
    () => subjects.filter((subject) => subject?._sharing?.isOwner !== false),
    [subjects]
  );

  const selectedSubject = ownSubjects.find((subject) => subject.subjectId === selectedSubjectId) || ownSubjects[0] || null;

  async function loadFriends() {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchFriendData();
      setFriendData(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadShares(subjectId = selectedSubject?.subjectId) {
    if (!subjectId) {
      setShares([]);
      return;
    }

    try {
      const data = await fetchSubjectShares(subjectId);
      setShares(data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSubjectId && ownSubjects[0]?.subjectId) {
      setSelectedSubjectId(ownSubjects[0].subjectId);
      return;
    }

    if (selectedSubjectId) {
      loadShares(selectedSubjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId, ownSubjects.length]);

  async function handleAddFriend(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await sendFriendRequest(friendSearch);
      setFriendData(data);
      setFriendSearch("");
      setSuccess("Friend request sent.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRespond(requestId, status) {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await respondFriendRequest(requestId, status);
      setFriendData(data);
      setSuccess(status === "accepted" ? "Friend request accepted." : "Friend request declined.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShareSubject(event) {
    event.preventDefault();
    const subjectId = selectedSubject?.subjectId;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await shareSubjectWithUser({
        subjectId,
        target: shareTarget,
        role: shareRole,
      });
      setShares(result.shares || []);
      setShareTarget("");
      if (result.copied) {
        setSuccess("Independent copy sent. Their version is separate, so their changes will not affect yours.");
      } else {
        setSuccess("Subject shared. Your friend will see it under their subjects after refreshing/logging in.");
      }
      if (typeof onSubjectsChanged === "function") await onSubjectsChanged();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveShare(shareId) {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await removeSubjectShare(shareId);
      await loadShares(selectedSubject?.subjectId);
      setSuccess("Share removed.");
      if (typeof onSubjectsChanged === "function") await onSubjectsChanged();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="revision-pro-shell">
      <div className="revision-page-container">
        <section className="revision-glass-card dashboard-hero-card mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <button className="btn btn-outline-secondary mb-3" type="button" onClick={onBackToDashboard}>
                Back to subjects
              </button>
              <p className="eyebrow mb-2">Friends & sharing</p>
              <h1 className="mb-2">Share revision work with friends</h1>
              <p className="muted mb-0">
                Add friends, accept requests, and share subjects as view-only, editable, or as an independent copy. Friends do not automatically see your work.
              </p>
            </div>
          </div>
        </section>

        <StatusMessage type="danger">{error}</StatusMessage>
        <StatusMessage type="success">{success}</StatusMessage>

        {isLoading ? (
          <div className="revision-glass-card">Loading friends...</div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-5">
              <section className="revision-glass-card h-100">
                <p className="eyebrow mb-2">Your profile</p>
                <h2 className="h4 mb-1">{personName(friendData?.currentProfile)}</h2>
                <p className="text-muted mb-4">{personSubtext(friendData?.currentProfile)}</p>

                <form onSubmit={handleAddFriend} className="mb-4">
                  <label className="form-label fw-semibold" htmlFor="friend-search">
                    Add a friend
                  </label>
                  <div className="input-group">
                    <input
                      id="friend-search"
                      className="form-control"
                      value={friendSearch}
                      onChange={(event) => setFriendSearch(event.target.value)}
                      placeholder="Friend email or username"
                    />
                    <button className="btn btn-primary" type="submit" disabled={isSaving || !friendSearch.trim()}>
                      Send request
                    </button>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    The other user needs to have logged in once so their profile exists.
                  </p>
                </form>

                <div className="mb-4">
                  <h3 className="h6">Incoming requests</h3>
                  {(friendData?.incoming || []).length === 0 ? (
                    <p className="text-muted small mb-0">No incoming requests.</p>
                  ) : (
                    <div className="list-group">
                      {friendData.incoming.map((request) => (
                        <div className="list-group-item" key={request.id}>
                          <strong>{personName(request.requester)}</strong>
                          <div className="small text-muted mb-2">{personSubtext(request.requester)}</div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-success" type="button" disabled={isSaving} onClick={() => handleRespond(request.id, "accepted")}>
                              Accept
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" type="button" disabled={isSaving} onClick={() => handleRespond(request.id, "declined")}>
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="h6">Friends</h3>
                  {(friendData?.friends || []).length === 0 ? (
                    <p className="text-muted small mb-0">No friends yet.</p>
                  ) : (
                    <div className="list-group">
                      {friendData.friends.map((request) => {
                        const friend = getOtherPerson(request, currentUser.id);
                        return (
                          <div className="list-group-item" key={request.id}>
                            <strong>{personName(friend)}</strong>
                            <div className="small text-muted">{personSubtext(friend)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="h6">Sent requests</h3>
                  {(friendData?.outgoing || []).length === 0 ? (
                    <p className="text-muted small mb-0">No pending sent requests.</p>
                  ) : (
                    <div className="list-group">
                      {friendData.outgoing.map((request) => (
                        <div className="list-group-item" key={request.id}>
                          <strong>{personName(request.receiver)}</strong>
                          <div className="small text-muted">Pending · {personSubtext(request.receiver)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="col-lg-7">
              <section className="revision-glass-card h-100">
                <p className="eyebrow mb-2">Subject sharing</p>
                <h2 className="h4 mb-3">Share an owned subject</h2>
                <p className="text-muted small mb-3">
                  Choose Viewer or Editor for a live shared subject, or Own copy if you want your friend to get a separate copy they can change safely.
                </p>

                {ownSubjects.length === 0 ? (
                  <p className="text-muted">Create a subject first, then you can share it here.</p>
                ) : (
                  <>
                    <form onSubmit={handleShareSubject} className="card revision-card shadow-sm mb-4">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-5">
                            <label className="form-label" htmlFor="share-subject">
                              Subject
                            </label>
                            <select
                              id="share-subject"
                              className="form-select"
                              value={selectedSubject?.subjectId || ""}
                              onChange={(event) => setSelectedSubjectId(event.target.value)}
                            >
                              {ownSubjects.map((subject) => (
                                <option key={subject.subjectId} value={subject.subjectId}>
                                  {subject.subjectName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="share-target">
                              Friend / user
                            </label>
                            <input
                              id="share-target"
                              className="form-control"
                              value={shareTarget}
                              onChange={(event) => setShareTarget(event.target.value)}
                              placeholder="Email or username"
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label" htmlFor="share-role">
                              Role
                            </label>
                            <select
                              id="share-role"
                              className="form-select"
                              value={shareRole}
                              onChange={(event) => setShareRole(event.target.value)}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="copy">Own copy</option>
                            </select>
                          </div>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                          <button className="btn btn-primary" type="submit" disabled={isSaving || !shareTarget.trim()}>
                            Share subject
                          </button>
                          <span className="small text-muted">
                            Viewer can revise only. Editor edits the live shared subject. Own copy gives them a separate subject that will not change yours.
                          </span>
                        </div>
                      </div>
                    </form>

                    <h3 className="h6">People with access to {selectedSubject?.subjectName}</h3>
                    {shares.length === 0 ? (
                      <p className="text-muted small">This subject has not been shared yet.</p>
                    ) : (
                      <div className="list-group">
                        {shares.map((share) => (
                          <div className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2" key={share.id}>
                            <div>
                              <strong>{personName(share.collaborator)}</strong>
                              <div className="small text-muted">
                                {personSubtext(share.collaborator)} · {share.role === "editor" ? "Editor" : "Viewer"}
                              </div>
                            </div>
                            <button className="btn btn-sm btn-outline-danger" type="button" disabled={isSaving} onClick={() => handleRemoveShare(share.id)}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
