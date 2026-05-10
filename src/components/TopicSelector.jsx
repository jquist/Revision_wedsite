import React from "react";

function TopicSelector({ subject, selectedTopicId, onSelectTopic }) {
  return (
    <div className="mb-3">
      <label className="form-label">Choose topic</label>

      <select
        className="form-select"
        value={selectedTopicId}
        onChange={(event) => onSelectTopic(event.target.value)}
      >
        {subject.topics.map((topic) => (
          <option key={topic.topicId} value={topic.topicId}>
            {topic.topicName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default TopicSelector;