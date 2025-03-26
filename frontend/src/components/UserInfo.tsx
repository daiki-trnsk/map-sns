import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import { API_HOST } from "../common";
import { AuthContext } from "../context/AuthContext";
import { formatDateToYYYYMMDDHHMM } from "../utils/format";
import { UserData } from "../types/user";
import pen from "../assets/pen.png";
import garbage from "../assets/garbage.png";
import account from "../assets/account.png";
import starBlack from "../assets/starBlack.png";
import starFrame from "../assets/starFrame.png";
import starYellow from "../assets/starYellow.png";
import starGray from "../assets/starGray.png";
import check from "../assets/check.png";
import back from "../assets/back.png";

export default function UserInfo({ userData }: { userData: UserData }) {
    const navigate = useNavigate();
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const [topics, setTopics] = useState(userData.topics);
    const [likedTopics, setLikedTopics] = useState(userData.liked_topics);
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editedTopic, setEditedTopic] = useState<{
        topic_title: string;
        description: string;
    } | null>(null);
    const [selectedList, setSelectedList] = useState("mine");

    useEffect(() => {
        if (userData.topics) {
            setTopics(userData.topics);
        }
        if (userData.liked_topics) {
            setLikedTopics(userData.liked_topics);
        }
    }, [userData]);

    if (!userData || !userData.user) {
        return <p></p>;
    }
    const user = userData.user;

    const editTopic = async (id: string) => {
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
        setTopics((prevTopics: Topic[]) =>
            prevTopics.map((topic) => (topic.id === id ? updatedTopic : topic))
        );
    };

    const deleteTopic = async (id: string) => {
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
        setTopics((prevTopics: Topic[]) =>
            prevTopics.filter((topic) => topic.id !== id)
        );
    };

    const handleEditClick = (topic: Topic) => {
        setEditingTopicId(topic.id);
        setEditedTopic({
            topic_title: topic.topic_title,
            description: topic.description,
        });
    };

    const handleDelClick = (id: string) => {
        deleteTopic(id);
    };

    const handleSaveClick = (id: string) => {
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
        setIsLoggedIn(false);
        navigate("/login");
    };

    const handleLikeClick = async (id: string, isLiked: boolean) => {
        const method = isLiked ? "DELETE" : "POST";
        const res = await fetch(`${API_HOST}/topics/${id}/like`, {
            method: `${method}`,
            headers: {
                "Content-Type": "application/json",
                Authorization: `${getToken()}`,
            },
        });
        if (!res.ok) {
            alert("お気に入り登録に失敗しました");
            return;
        }
        const updatedTopic = await res.json();
        setLikedTopics((prevTopics: any[]) =>
            prevTopics.map((topic) =>
                topic.id === id
                    ? {
                          ...topic,
                          is_liked: !isLiked,
                          like_count: isLiked
                              ? topic.like_count - 1
                              : topic.like_count + 1,
                      }
                    : topic
            )
        );
    };

    return (
        <div className="user">
            <div className="user-info">
                <h1>{user.nickname}</h1>
                <h3>{user.email}</h3>
                <button onClick={handleLogout}>ログアウト</button>
            </div>
            <div className="user-topics">
                <div className="list-selecter">
                    <div
                        className={
                            selectedList === "mine"
                                ? "list-selected"
                                : "list-selecter-right"
                        }
                    >
                        <button
                            onClick={() => setSelectedList("mine")}
                            // className={selectedList === "mine" ? "selected" : ""}
                        >
                            <img src={account} className="account-img" />
                        </button>
                    </div>
                    <div
                        className={
                            selectedList === "liked"
                                ? "list-selected"
                                : "list-selecter-left"
                        }
                    >
                        <button
                            onClick={() => setSelectedList("liked")}
                            // className={selectedList === "liked" ? "selected" : ""}
                        >
                            <img src={starBlack} className="star-img" />
                        </button>
                    </div>
                </div>
                {selectedList === "mine" ? (
                    topics && topics.length > 0 ? (
                        topics.map((topic: Topic) => (
                            <div key={topic.id} className="topic-item">
                                {editingTopicId === topic.id ? (
                                    <div className="topic-item-content">
                                        <div className="topic-edit">
                                            <input
                                                type="text"
                                                value={
                                                    editedTopic?.topic_title ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setEditedTopic({
                                                        topic_title: e.target.value,
                                                        description: editedTopic?.description || "",
                                                    })
                                                }
                                            />
                                            <textarea
                                                value={editedTopic?.description || ""}
                                                onChange={(e) =>
                                                    setEditedTopic({
                                                        topic_title: editedTopic?.topic_title || "",
                                                        description: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="topic-edit-buttons">
                                            <button onClick={handleCancelClick}>
                                                <img
                                                    src={back}
                                                    className="back-img"
                                                />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSaveClick(topic.id)
                                                }
                                            >
                                                <img
                                                    src={check}
                                                    className="check-img"
                                                />
                                            </button>
                                        </div>
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
                                                <div className="topic-item-info-created">
                                                    <p>
                                                        {" "}
                                                        Created:&emsp;
                                                        {formatDateToYYYYMMDDHHMM(
                                                            topic.created_at
                                                        )}
                                                    </p>
                                                    <p>
                                                        {" "}
                                                        Updeted:&emsp;
                                                        {formatDateToYYYYMMDDHHMM(
                                                            topic.updated_at
                                                        )}
                                                    </p>
                                                </div>
                                                {isLoggedIn && (
                                                    <div className="topic-item-info-likes">
                                                        <img
                                                            src={starGray}
                                                            className="star-img"
                                                        />
                                                        <p>
                                                            {topic.like_count}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="topic-buttons">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleEditClick(topic);
                                                    }}
                                                >
                                                    <img
                                                        src={pen}
                                                        className="pen-img"
                                                    />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleDelClick(
                                                            topic.id
                                                        );
                                                    }}
                                                >
                                                    <img
                                                        src={garbage}
                                                        className="garbage-img"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>まだトピックを投稿していません</p>
                    )
                ) : (
                    <div className="topic-list-liked">
                        {Array.isArray(likedTopics) &&
                        likedTopics.length > 0 ? (
                            likedTopics.map((topic) => (
                                <Link
                                    to={`/topic/${topic.id}`}
                                    className="topic-item"
                                    key={topic.id}
                                >
                                    <div
                                        key={topic.id}
                                        className="topic-item-content"
                                    >
                                        <div className="topic-item-title">
                                            {topic.topic_title}
                                        </div>
                                        <div className="topic-item-description">
                                            <p>{topic.description}</p>
                                        </div>
                                        <div className="topic-item-info">
                                            <div className="topic-item-info-created">
                                                <p>by {topic.nickname}</p>
                                                <p>
                                                    {formatDateToYYYYMMDDHHMM(
                                                        topic.created_at
                                                    )}
                                                </p>
                                            </div>
                                            {isLoggedIn && (
                                                <div className="topic-item-info-likes">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleLikeClick(
                                                                topic.id,
                                                                topic.is_liked
                                                            );
                                                        }}
                                                    >
                                                        {topic.is_liked ? (
                                                            <img
                                                                src={starYellow}
                                                                className="star-img"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={starFrame}
                                                                className="star-img"
                                                            />
                                                        )}
                                                    </button>
                                                    <p>{topic.like_count}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p>まだトピックにいいねしていません</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
