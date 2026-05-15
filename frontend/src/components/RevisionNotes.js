import React from "react";

function normaliseNotes(topic) {
  return topic.notes || topic.revisionNotes || topic.revision_notes || [];
}

function RevisionNotes({ topic }) {
  const notes = normaliseNotes(topic);

  if (notes.length === 0) {
    return <p>No revision notes yet.</p>;
  }

  return (
    <div>
      <h2>Revision Notes</h2>
      {notes.map((note, index) => (
        <div className="card shadow-sm mb-3 revision-card" key={note.noteId || note.id || note.heading || index}>
          <div className="card-body">
            <h3 className="h5">{note.heading || note.title || `Note ${index + 1}`}</h3>
            <p className="mb-0 whitespace-pre-line">{note.content || note.text || note.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RevisionNotes;
