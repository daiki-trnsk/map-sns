import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopicList from "../components/TopicList";

export default function Home() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return (
    <TopicList topics={topics}/>
  );
}