import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { UserData } from "../types/user";
import Footer from "../components/UI/Footer";
import UserInfo from "../components/UserInfo";
import Header from "../components/UI/Header";

export default function User() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData>();
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
            <Footer />
        </>
    );
}
