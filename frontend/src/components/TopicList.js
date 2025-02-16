import React from "react";
import { Link } from "react-router-dom";

export default function TopicList({ topics }) {
  return (
    <div>
      <h1>トピック一覧</h1>
      {topics.map((topic) => (
        <div key={topic.id}>
          <Link to={`/topic/${topic.id}`}>{topic.topic_title}</Link>
          <p>{topic.description}</p>
        </div>
      ))}
    </div>
  );
}
