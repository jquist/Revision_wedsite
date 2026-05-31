import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminDashboard } from "../utils/api";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString("en-GB") : "0";
}

function StatCard({ label, value, help }) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-label">{label}</p>
      <strong>{formatNumber(value)}</strong>
      {help && <span>{help}</span>}
    </div>
  );
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-muted py-4">
        {children || "Nothing to show yet."}
      </td>
    </tr>
  );
}

function AdminPage({ currentUser, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadDashboard() {
    setStatus("loading");
    setError("");

    try {
      const data = await fetchAdminDashboard();
      setDashboard(data);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError.message || "Could not load the admin dashboard.");
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = dashboard?.stats || {};
  const users = useMemo(() => dashboard?.users || [], [dashboard]);
  const subjects = useMemo(() => dashboard?.subjects || [], [dashboard]);
  const shares = useMemo(() => dashboard?.shares || [], [dashboard]);
  const friendRequests = useMemo(() => dashboard?.friendRequests || [], [dashboard]);
  const betaInterest = useMemo(() => dashboard?.betaInterest || [], [dashboard]);
  const adminEmails = useMemo(() => dashboard?.adminEmails || [], [dashboard]);

  if (status === "loading") {
    return <main className="container py-5">Loading admin dashboard...</main>;
  }

  if (status === "error") {
    return (
      <main className="revision-pro-shell admin-shell">
        <div className="revision-page-container">
          <section className="revision-glass-card admin-hero-card">
            <p className="eyebrow">Admin</p>
            <h1>Admin access only</h1>
            <p className="muted">
              You must be signed in with an approved admin email to view this page.
            </p>
            <div className="alert alert-danger mb-3">{error}</div>
            <div className="button-row">
              <a className="btn btn-outline-secondary" href="/">
                Back to app
              </a>
              {onLogout && (
                <button className="btn btn-outline-danger" type="button" onClick={onLogout}>
                  Log out
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="revision-pro-shell admin-shell">
      <div className="revision-page-container admin-layout">
        <section className="revision-glass-card admin-hero-card">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>ForgeNotes admin dashboard</h1>
            <p className="muted mb-0">
              Signed in as {currentUser?.email || "an admin"}. This page uses protected Supabase RPC checks, so non-admin users cannot read this data even if they visit /admin directly.
            </p>
          </div>
          <div className="button-row">
            <button className="btn btn-primary" type="button" onClick={loadDashboard}>
              Refresh
            </button>
            <a className="btn btn-outline-secondary" href="/">
              Back to app
            </a>
            {onLogout && (
              <button className="btn btn-outline-danger" type="button" onClick={onLogout}>
                Log out
              </button>
            )}
          </div>
        </section>

        <section className="admin-stat-grid" aria-label="Site statistics">
          <StatCard label="Auth users" value={stats.authUsers} help="Supabase login accounts" />
          <StatCard label="Profiles" value={stats.profiles} help="Users with ForgeNotes profiles" />
          <StatCard label="Subjects" value={stats.subjects} help="All saved revision subjects" />
          <StatCard label="Shared subjects" value={stats.subjectShares} help="Viewer/editor links" />
          <StatCard label="Friend requests" value={stats.friendRequests} help={`${formatNumber(stats.pendingFriendRequests)} pending`} />
          <StatCard label="Beta interest" value={stats.betaInterest} help="Pricing page responses" />
          <StatCard label="Admins" value={adminEmails.length} help="Approved admin emails" />
        </section>

        <section className="revision-glass-card admin-card">
          <div className="admin-section-heading">
            <div>
              <h2 className="h4 mb-1">Users</h2>
              <p className="muted mb-0">Account, profile, sign-in, and ownership summary.</p>
            </div>
          </div>
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Display name</th>
                  <th>Admin</th>
                  <th>Subjects</th>
                  <th>Shares</th>
                  <th>Created</th>
                  <th>Last sign in</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <EmptyRow colSpan={8}>No users found.</EmptyRow>
                ) : (
                  users.map((user) => (
                    <tr key={user.id || user.email}>
                      <td>{user.email || "—"}</td>
                      <td>{user.username ? `@${user.username}` : "—"}</td>
                      <td>{user.displayName || "—"}</td>
                      <td>{user.isAdmin ? <span className="admin-badge">Admin</span> : "—"}</td>
                      <td>{formatNumber(user.subjectCount)}</td>
                      <td>{formatNumber(user.ownedShareCount)} owned / {formatNumber(user.collaboratingCount)} shared to them</td>
                      <td>{formatDate(user.createdAt || user.authCreatedAt)}</td>
                      <td>{formatDate(user.lastSignInAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="revision-glass-card admin-card">
          <div className="admin-section-heading">
            <div>
              <h2 className="h4 mb-1">Subjects</h2>
              <p className="muted mb-0">Revision content totals by owner. Raw notes/cards are not printed here, but counts and metadata are shown.</p>
            </div>
          </div>
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Owner</th>
                  <th>Topics</th>
                  <th>Cards</th>
                  <th>Questions</th>
                  <th>Notes</th>
                  <th>Files</th>
                  <th>Shares</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <EmptyRow colSpan={9}>No subjects found.</EmptyRow>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <strong>{subject.subjectName || "Untitled subject"}</strong>
                        <small className="d-block text-muted">{subject.subjectId}</small>
                      </td>
                      <td>
                        {subject.ownerEmail || "—"}
                        {subject.ownerName && <small className="d-block text-muted">{subject.ownerName}</small>}
                      </td>
                      <td>{formatNumber(subject.topicCount)}</td>
                      <td>{formatNumber(subject.flashcardCount)}</td>
                      <td>{formatNumber(subject.quizQuestionCount)}</td>
                      <td>{formatNumber(subject.noteCount)}</td>
                      <td>{formatNumber(subject.sourceFileCount)}</td>
                      <td>{formatNumber(subject.shareCount)}</td>
                      <td>{formatDate(subject.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-two-column">
          <section className="revision-glass-card admin-card">
            <h2 className="h4">Subject sharing</h2>
            <div className="table-responsive admin-table-wrap compact">
              <table className="table table-hover align-middle admin-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Owner</th>
                    <th>Collaborator</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.length === 0 ? (
                    <EmptyRow colSpan={4}>No active shares.</EmptyRow>
                  ) : (
                    shares.map((share) => (
                      <tr key={share.id}>
                        <td>{share.subjectName || share.subjectId}</td>
                        <td>{share.ownerEmail || "—"}</td>
                        <td>{share.collaboratorEmail || "—"}</td>
                        <td><span className="admin-role-pill">{share.role}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="revision-glass-card admin-card">
            <h2 className="h4">Friend requests</h2>
            <div className="table-responsive admin-table-wrap compact">
              <table className="table table-hover align-middle admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {friendRequests.length === 0 ? (
                    <EmptyRow colSpan={4}>No friend requests.</EmptyRow>
                  ) : (
                    friendRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.requesterEmail || "—"}</td>
                        <td>{request.receiverEmail || "—"}</td>
                        <td><span className="admin-role-pill">{request.status}</span></td>
                        <td>{formatDate(request.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>


        <section className="revision-glass-card admin-card">
          <div className="admin-section-heading">
            <div>
              <h2 className="h4 mb-1">Beta pricing interest</h2>
              <p className="muted mb-0">People who filled in the pricing page interest form. This is not payment data.</p>
            </div>
          </div>
          <div className="table-responsive admin-table-wrap">
            <table className="table table-hover align-middle admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Interest</th>
                  <th>Subjects</th>
                  <th>Notes</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {betaInterest.length === 0 ? (
                  <EmptyRow colSpan={7}>No pricing interest responses yet.</EmptyRow>
                ) : (
                  betaInterest.map((entry) => (
                    <tr key={entry.id || `${entry.email}-${entry.createdAt}`}>
                      <td>{entry.email || "—"}</td>
                      <td>{entry.name || "—"}</td>
                      <td><span className="admin-role-pill">{entry.role || "—"}</span></td>
                      <td>{entry.wantedPlan || "—"}</td>
                      <td>{entry.subjects || "—"}</td>
                      <td className="admin-notes-cell">{entry.notes || "—"}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="revision-glass-card admin-card">
          <h2 className="h4">Approved admin emails</h2>
          <p className="muted">
            These emails are allowed into /admin. Add more by inserting rows into <code>public.admin_emails</code> in Supabase.
          </p>
          <div className="admin-email-list">
            {adminEmails.map((email) => (
              <span className="admin-email-pill" key={email}>{email}</span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminPage;
