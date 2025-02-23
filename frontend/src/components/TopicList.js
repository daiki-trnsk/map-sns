import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_HOST } from "../common";

export default function TopicList() {
  const [topics, setTopics] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTopics = async () => {
    try {
      const query = searchValue ? `${encodeURIComponent(searchValue)}` : "";
      const res = await fetch(`${API_HOST}/topics?title=${query}`);
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [searchValue]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchValue(e.target.elements[0].value);
  };

  return (
    <div className="topic-list">
      <details>
        <summary>トピックを追加する</summary>
        <form onSubmit={handleSubmit} className="topic-form">
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
      </details>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input type="text" placeholder="キーワード" />
        <button type="submit">検索</button>
      </form>

      {(topics ?? []).map((topic) => (
        <Link to={`/topic/${topic.id}`} className="topic-title">
          <div key={topic.id} className="topic-item">
            {topic.topic_title}
            <p>{topic.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
