import React from "react";
import { ALL_TOPICS_ID } from "../utils/revisionHelpers";

function TopicSelector({ subject, selectedTopicId, onSelectTopic }) {
  return (
    <div className="mb-3">
      <label className="form-label">Choose topic</label>

      <select
        className="form-select"
        value={selectedTopicId}
        onChange={(event) => onSelectTopic(event.target.value)}
      >
        <option value={ALL_TOPICS_ID}>All topics</option>

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
