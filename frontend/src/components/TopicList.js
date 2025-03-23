import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";
import { formatDateToYYYYMMDDHHMM } from "../utils/format";
import search from "../assets/search.png";
import starFrame from "../assets/starFrame.png";
import starYellow from "../assets/starYellow.png";

export default function TopicList() {
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const [topics, setTopics] = useState([]);
    const [searchValue, setSearchValue] = useState("");

    const fetchTopics = async () => {
        try {
            const query = searchValue
                ? `${encodeURIComponent(searchValue)}`
                : "";
            const token = getToken();
            const res = await fetch(`${API_HOST}/topics?title=${query}`, {
                headers: token
                    ? {
                          Authorization: `${token}`,
                          "Content-Type": "application/json",
                      }
                    : {},
            });
            const data = await res.json();
            setTopics(data);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, [searchValue]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchValue(e.target.elements[0].value);
    };

    const handleLikeClick = async (id, isLiked) => {
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
        console.log(updatedTopic);
        setTopics((prevTopics) =>
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
        <div className="topic-list">
            <form onSubmit={handleSearchSubmit} className="search-form">
                <input type="text" placeholder="キーワード" />
                <button type="submit">
                    <img src={search} className="search-img" />
                </button>
            </form>

            {(topics ?? []).map((topic) => (
                <Link
                    to={`/topic/${topic.id}`}
                    className="topic-item"
                    key={topic.id}
                >
                    <div key={topic.id} className="topic-item-content">
                        <div className="topi-item-main">
                            <div className="topic-item-title">
                                {topic.topic_title}
                            </div>
                            <div className="topic-item-description">
                                <p>{topic.description}</p>
                            </div>
                        </div>
                        <div className="topic-item-info">
                            <div className="topic-item-info-created">
                                <p>by {topic.nickname}</p>
                                <p>
                                    {formatDateToYYYYMMDDHHMM(topic.created_at)}
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
                                                <img src={starYellow} className="star-img" />
                                            ) : (
                                                <img src={starFrame} className="star-img" />
                                            )}
                                        </button>
                                        <p>{topic.like_count}</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
