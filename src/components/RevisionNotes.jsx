import React from "react";

function RevisionNotes({ topic }) {
  const notes = topic.notes || [];

  return (
    <div>
      <h2>Revision Notes</h2>

      <div className="alert alert-secondary">
        <strong>Summary:</strong> {topic.summary}
      </div>

      {notes.map((note) => (
        <div className="card shadow-sm mb-3" key={note.noteId}>
          <div className="card-body">
            <h4>{note.heading}</h4>
            <p>{note.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RevisionNotes;