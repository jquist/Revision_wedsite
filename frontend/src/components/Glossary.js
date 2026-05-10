import React from "react";

function Glossary({ topic }) {
  const glossary = topic.glossary || [];

  if (glossary.length === 0) {
    return <p>No glossary terms yet.</p>;
  }

  return (
    <div>
      <h2>Glossary</h2>

      {glossary.map((item) => (
        <div className="card shadow-sm mb-3" key={item.term}>
          <div className="card-body">
            <h4>{item.term}</h4>
            <p>{item.definition}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Glossary;
