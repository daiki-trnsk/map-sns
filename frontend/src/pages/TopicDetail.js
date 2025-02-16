import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Map from "../components/Map";

export default function TopicDetail() {
  const { id } = useParams();  // URL からトピックIDを取得
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/topics/${id}`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error:", err));
  }, [id]);

  return (
    <div>
      <h1>トピック詳細</h1>
      <Map posts={posts} />
    </div>
  );
}

