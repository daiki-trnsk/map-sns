import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Map from "../components/Map";
import { API_HOST } from "../common";

export default function TopicDetail() {
  const { id } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_HOST}/topics/${id}`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error:", err));
  }, [id]);

  const handleAddPost = (newPost) => {
    setPosts((prevPosts) => [...(prevPosts || []), newPost]);
  };

  return (
    <div className="full-view">
      <Link to={"/"}>
        <div className="app-title">Mapost</div>
      </Link>
      <Map posts={posts} onAddPost={handleAddPost} id={id} />
    </div>
  );
}
