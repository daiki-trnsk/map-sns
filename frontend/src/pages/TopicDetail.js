import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Map from "../components/Map";

export default function TopicDetail() {
  const { id } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/topics/${id}`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error:", err));
  }, [id]);

  const handleAddPost = (newPost) => {
    setPosts((prevPosts) => [...(prevPosts || []), newPost]);
  };

  return (
    <div>
      <Map posts={posts} onAddPost={handleAddPost} id={id} />
    </div>
  );
}

