import React, { useContext, useState } from "react";
import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import { AuthContext } from "../context/AuthContext";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { Link } from "react-router-dom";

export default function TopicCreate() {
    const { isLoggedIn } = useContext(AuthContext);
    const [topicTitle, setTopicTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
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
        } catch (error) {
            console.error("エラー:", error);
            alert("トピックの追加に失敗しました");
        }
    };

    return (
        <>
            <Header />
            <div className="topic-create-container">
                {isLoggedIn ? (
                    <form onSubmit={handleSubmit} className="topic-form">
                        <input
                            className="topic-form-title"
                            value={topicTitle}
                            onChange={(e) => setTopicTitle(e.target.value)}
                            placeholder="トピックのタイトル"
                            maxLength={500}
                            required
                        />
                        <textarea
                            className="topic-form-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="トピックの説明"
                            maxLength={500}
                            required
                        />
                        <button type="submit">POST</button>
                    </form>
                ) : (
                    <div className="login-for-topic">
                        ログインしてトピックを投稿
                        <Link to="/login" className="login-button">
                            Login
                        </Link>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
