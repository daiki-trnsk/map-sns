import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopicList from "../components/TopicList";
import { API_HOST } from "../common";

export default function Home() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch(`${API_HOST}/topics`)
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return (
    <TopicList topics={topics}/>
  );
}