import React from "react";
import { ALL_TOPICS_ID } from "../utils/revisionHelpers";

function TopicSelector({ subject, selectedTopicId, onSelectTopic, showAllTopics = true }) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor="topic-select">Topic</label>
      <select
        id="topic-select"
        className="form-select"
        value={selectedTopicId}
        onChange={(event) => onSelectTopic(event.target.value)}
      >
        {showAllTopics && <option value={ALL_TOPICS_ID}>All Topics</option>}
        {(subject.topics || []).map((topic) => (
          <option key={topic.topicId} value={topic.topicId}>
            {topic.topicName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default TopicSelector;
