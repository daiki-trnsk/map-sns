import React, { use, useContext, useEffect, useState } from "react";
import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import { AuthContext } from "../context/AuthContext";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import send from "../assets/send.png";

export default function TopicCreate() {
    const { isLoggedIn } = useContext(AuthContext);
    const [topicTitle, setTopicTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!getToken()) {
            navigate("/login");
            return;
        }
    });

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();

        if (!topicTitle.trim() || !description.trim()) {
            alert("タイトルと説明を入力してください！");
            return;
        }

        const newTopic = {
            topic_title: topicTitle,
            description: description,
        };

        setIsLoading(true);

        try {
            const res = await fetch(`${API_HOST}/topics`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${getToken()}`,
                },
                body: JSON.stringify(newTopic),
            });

            if (!res.ok) {
                throw new Error("トピックの追加に失敗しました");
            }

            const data = await res.json();
            // setTopics((prevTopics) => [...prevTopics, data]);
            setTopicTitle("");
            setDescription("");
            navigate("/");
        } catch (error) {
            console.error("エラー:", error);
            alert("トピックの追加に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="topic-create-container">
                <form onSubmit={handleSubmit} className="topic-form">
                    <input
                        className="topic-form-title"
                        value={topicTitle}
                        onChange={(e) => setTopicTitle(e.target.value)}
                        placeholder="title"
                        maxLength={500}
                        required
                    />
                    <textarea
                        className="topic-form-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="description"
                        maxLength={500}
                        required
                    />
                    {isLoading ? (
                        <div className="spinner-box">
                            <div className="three-quarter-spinner"></div>
                        </div>
                    ) : (
                        <button type="submit">
                            <img src={send} className="send-img" />
                        </button>
                    )}
                </form>
            </div>
            <Footer />
        </>
    );
}
