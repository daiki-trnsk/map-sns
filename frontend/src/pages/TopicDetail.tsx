import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Map from "../components/Map";
import { API_HOST } from "../common";
import Footer from "../components/UI/Footer";
import Header from "../components/UI/Header";
import { getToken } from "../utils/auth";
import React from "react";

export default function TopicDetail() {
    const { id } = useParams();
    const [posts, setPosts] = useState<any[]>([]);
    const location = useLocation();
    const title = location.state as string;

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

    const handleAddPost = (newPost: any) => {
        setPosts((prevPosts) => [...(prevPosts || []), newPost]);
    };

    return (
        <div className="full-view">
            <Header />
            {/* ピン取得時にタイトルも取得するあとで */}
            {title && <div className="topic-detail-header">{title}</div>}
            <Map posts={posts} onAddPost={handleAddPost} id={id} />
            <Footer />
        </div>
    );  
}
