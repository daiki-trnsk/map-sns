import React, { use, useContext, useEffect, useState } from "react";
import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import { AuthContext } from "../context/AuthContext";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import send from "../assets/send.png";

export default function TopicCreate() {
    const { isLoggedIn } = useContext(AuthContext);
    const [topicTitle, setTopicTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [autoSubmitting, setAutoSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!getToken()) {
            navigate("/login");
            return;
        }
    });

    // checkout 成功で戻ってきたら sessionStorage の保留トピックを自動送信
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("checkout") === "success") {
            const pending = sessionStorage.getItem("pending_topic_create");
            if (pending && !autoSubmitting) {
                (async () => {
                    try {
                        setAutoSubmitting(true);
                        setIsLoading(true);
                        const pendingTopic = JSON.parse(pending);
                        const res = await fetch(`${API_HOST}/topics`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `${getToken()}`,
                            },
                            body: JSON.stringify(pendingTopic),
                        });
                        if (res.ok) {
                            sessionStorage.removeItem("pending_topic_create");
                            const data = await res.json();
                            setTopicTitle("");
                            setDescription("");
                            navigate("/");
                        } else {
                            // 再試行はユーザー操作に任せる（保存は残す）
                            console.error("自動投稿に失敗しました", res.status);
                        }
                    } catch (err) {
                        console.error("自動投稿エラー:", err);
                    } finally {
                        setIsLoading(false);
                        setAutoSubmitting(false);
                    }
                })();
            }
        }
    }, [location.search, navigate, autoSubmitting]);

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

            if (res.status === 402) {
                // サーバーが課金を要求したら Checkout セッション作成してリダイレクト
                // 保留データを保存（checkout 後に自動再送）
                sessionStorage.setItem("pending_topic_create", JSON.stringify(newTopic));
                 const sres = await fetch(`${API_HOST}/subscriptions/create-session`, {
                     method: "POST",
                     headers: {
                         Authorization: `${getToken()}`,
                         "Content-Type": "application/json",
                     },
                 });
                 if (sres.ok) {
                     const data = await sres.json();
                     window.location.href = data.url; // Stripe checkout にリダイレクト
                     return;
                 } else {
                    alert("サブスクセッションの作成に失敗しました");
                     return;
                 }
             }

             if (!res.ok) {
                 throw new Error("トピックの追加に失敗しました");
             }

             const data = await res.json();
            // 正常登録なら保留を削除
            sessionStorage.removeItem("pending_topic_create");
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
