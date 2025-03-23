import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Map from "../components/Map";
import { API_HOST } from "../common";
import Footer from "../components/UI/Footer";
import Header from "../components/UI/Header";
import { getToken } from "../utils/auth";

export default function TopicDetail() {
    const { id } = useParams();
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const token = getToken();
        fetch(`${API_HOST}/topics/${id}`, {
            headers: token
                ? {
                      Authorization: `${token}`,
                      "Content-Type": "application/json",
                  }
                : {},
        })
            .then((res) => res.json())
            .then((data) => setPosts(data))
            .catch((err) => console.error("Error:", err));
    }, [id]);

    const handleAddPost = (newPost) => {
        setPosts((prevPosts) => [...(prevPosts || []), newPost]);
    };

    return (
        <div className="full-view">
            <Header />
            <Map posts={posts} onAddPost={handleAddPost} id={id} />
            <Footer />
        </div>
    );
}
