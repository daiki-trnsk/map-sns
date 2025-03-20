import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import { API_HOST } from "../common";
import { AuthContext } from "../context/AuthContext";
import { formatDateToYYYYMMDDHHMM } from "../utils/format";

export default function UserInfo({ userData }) {
    const navigate = useNavigate();
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const [topics, setTopics] = useState(userData.topics);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [editedTopic, setEditedTopic] = useState(null);

    useEffect(() => {
        if (userData.topics) {
            setTopics(userData.topics);
        }
    }, [userData]);

    if (!userData || !userData.user) {
        return <p></p>;
    }
    const user = userData.user;

    const editTopic = async (id) => {
        const res = await fetch(`${API_HOST}/topics/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${getToken()}`,
            },
            body: JSON.stringify(editedTopic),
        });
        if (!res.ok) {
            alert("編集に失敗しました");
            return;
        }
        const updatedTopic = await res.json();
        setTopics((prevTopics) =>
            prevTopics.map((topic) => (topic.id === id ? updatedTopic : topic))
        );
    };

    const deleteTopic = async (id) => {
        const res = await fetch(`${API_HOST}/topics/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `${getToken()}`,
            },
        });
        if (!res.ok) {
            alert("削除に失敗しました");
            return;
        }
        setTopics((prevTopics) =>
            prevTopics.filter((topic) => topic.id !== id)
        );
    };

    const handleEditClick = (topic) => {
        setEditingTopicId(topic.id);
        setEditedTopic({
            topic_title: topic.topic_title,
            description: topic.description,
        });
    };

    const handleDelClick = (id) => {
        deleteTopic(id);
    };

    const handleSaveClick = (id) => {
        editTopic(id);
        setEditingTopicId(null);
        setEditedTopic({ topic_title: "", description: "" });
    };

    const handleCancelClick = () => {
        setEditingTopicId(null);
        setEditedTopic({ topic_title: "", description: "" });
    };

    const handleLogout = () => {
        removeToken();
        setIsLoggedIn(null);
        navigate("/login");
    };

    return (
        <div className="user">
            <div className="user-info">
                <h1>{user.nickname}</h1>
                <h3>{user.email}</h3>
                <button onClick={handleLogout}>ログアウト</button>
            </div>
            <div className="user-topics">
                <h2>あなたのトピック</h2>
                {topics && topics.length > 0 ? (
                    topics.map((topic) => (
                        <div key={topic.id} className="topic-item">
                            {editingTopicId === topic.id ? (
                                <div className="topic-item-content">
                                    <input
                                        type="text"
                                        value={editedTopic.topic_title}
                                        onChange={(e) =>
                                            setEditedTopic({
                                                ...editedTopic,
                                                topic_title: e.target.value,
                                            })
                                        }
                                    />
                                    <textarea
                                        value={editedTopic.description}
                                        onChange={(e) =>
                                            setEditedTopic({
                                                ...editedTopic,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                    <button
                                        onClick={() =>
                                            handleSaveClick(topic.id)
                                        }
                                    >
                                        完了
                                    </button>
                                    <button onClick={handleCancelClick}>
                                        取り消し
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to={`/topic/${topic.id}`}
                                    className="topic-item"
                                    key={topic.id}
                                >
                                    <div className="topic-item-content">
                                        <div className="topic-item-title">
                                            {topic.topic_title}
                                        </div>
                                        <div className="topic-item-description">
                                            <p>{topic.description}</p>
                                        </div>
                                        <div className="topic-item-info">
                                            <p> Created:&emsp;
                                                {formatDateToYYYYMMDDHHMM(
                                                    topic.created_at
                                                )}
                                            </p>
                                            <p> Updeted:&emsp;
                                                {formatDateToYYYYMMDDHHMM(
                                                    topic.updated_at
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleEditClick(topic);
                                            }}
                                        >
                                            edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelClick(topic.id);
                                            }}
                                        >
                                            del
                                        </button>
                                    </div>
                                </Link>
                            )}
                        </div>
                    ))
                ) : (
                    <p>まだトピックを投稿していません</p>
                )}
            </div>
        </div>
    );
}
