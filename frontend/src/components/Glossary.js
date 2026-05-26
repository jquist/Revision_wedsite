import React from "react";

function Glossary({ topic }) {
  const glossary = topic.glossary || [];

  if (glossary.length === 0) {
    return <p>No glossary terms yet.</p>;
  }

  return (
    <div>
      <h2>Glossary</h2>
      <div className="row g-3">
        {glossary.map((item, index) => (
          <div className="col-md-6" key={`${item.term}-${index}`}>
            <div className="card shadow-sm revision-card h-100">
              <div className="card-body">
                <h3 className="h5">{item.term}</h3>
                <p className="mb-0">{item.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Glossary;
