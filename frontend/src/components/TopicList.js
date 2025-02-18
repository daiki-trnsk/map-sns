import React, { useState } from "react";
import { Link } from "react-router-dom";
import {API_HOST} from "../common";

export default function TopicList({ topics, setTopics }) {
  const [topicTitle, setTopicTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topicTitle.trim() || !description.trim()) {
      alert("タイトルと説明を入力してください！");
      return;
    }

    const newTopic = {
      topic_title: topicTitle,
      description: description,
    };

    try {
      console.log("apihost", API_HOST)
      const res = await fetch(`${API_HOST}/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTopic),
      });

      if (!res.ok) {
        throw new Error("トピックの追加に失敗しました");
      }

      const data = await res.json();
      
      setTopics((prevTopics) => [...prevTopics, data]);

      setTopicTitle("");
      setDescription("");
    } catch (error) {
      console.error("エラー:", error);
      alert("トピックの追加に失敗しました");
    }
  };

  return (
    <div>
      <h1>トピック一覧</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={topicTitle}
          onChange={(e) => setTopicTitle(e.target.value)}
          placeholder="トピックのタイトル"
          required
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="トピックの説明"
          required
        />
        <button type="submit">追加</button>
      </form>

      {(topics ?? []).map((topic) => (
        <div key={topic.id}>
          <Link to={`/topic/${topic.id}`}>{topic.topic_title}</Link>
          <p>{topic.description}</p>
        </div>
      ))}
    </div>
  );
}
