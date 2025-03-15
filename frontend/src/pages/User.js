import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import Header from "../components/UI/header";
import UserInfo from "../components/UserInfo";

export default function User() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState([]);
    // トピックリスト再利用？
    useEffect(() => {
        if (!getToken()) {
            navigate("/login");
            return;
        }
        fetch(`${API_HOST}/me`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `${getToken()}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setUserData(data))
            .catch((err) => console.error("Error:", err));
    }, []);

    return (
        <>
            <Header />
            <div className="topic-list">
                {userData ? (
                    <UserInfo userData={userData} />
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </>
    );
}
