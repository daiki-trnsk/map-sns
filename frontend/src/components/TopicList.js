import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";
import { formatDateToYYYYMMDDHHMM } from "../utils/format";

export default function TopicList() {
    const [topics, setTopics] = useState([]);
    const [searchValue, setSearchValue] = useState("");

    const fetchTopics = async () => {
        try {
            const query = searchValue
                ? `${encodeURIComponent(searchValue)}`
                : "";
            const res = await fetch(`${API_HOST}/topics?title=${query}`);
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

    return (
        <div className="topic-list">
            <form onSubmit={handleSearchSubmit} className="search-form">
                <input type="text" placeholder="キーワード" />
                <button type="submit">検索</button>
            </form>

            {(topics ?? []).map((topic) => (
                <Link
                    to={`/topic/${topic.id}`}
                    className="topic-item"
                    key={topic.id}
                >
                    <div key={topic.id} className="topic-item-content">
                        <div className="topic-item-title">
                            {topic.topic_title}
                        </div>
                        <div className="topic-item-description">
                            <p>{topic.description}</p>
                        </div>
                        <div className="topic-item-info">
                            <p>by {topic.nickname}</p>
                            <p>{formatDateToYYYYMMDDHHMM(topic.created_at)}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
