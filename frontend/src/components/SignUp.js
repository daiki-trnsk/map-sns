import React, { useState, useContext } from "react";
import { API_HOST } from "../common";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";

export default function SignUp() {
    const { setIsLoggedIn } = useContext(AuthContext);

    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nickname.trim() || !email.trim() || !password.trim()) {
            alert("全ての項目を入力してください");
            return;
        }
        const userData = {
            nickname: nickname,
            email: email,
            password: password,
        };
        try {
            const res = await fetch(`${API_HOST}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });
            if (!res.ok) {
                throw new Error("Failed to sign up");
            }
            const data = await res.json();
            console.log("user data:", data);
            setToken(data.token);
            setIsLoggedIn(data);

            setNickname("");
            setEmail("");
            setPassword("");

            navigate("/");
        } catch (error) {
            console.error(error);
            alert("サインアップに失敗しました");
        }
    };

    return (
        <div className="auth-container">
            <div className="login-form">
                <form onSubmit={handleSubmit} className="email-form">
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="nickname"
                        maxLength={500}
                        required
                    />
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-mail"
                        maxLength={500}
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="pasword"
                        maxLength={500}
                        required
                    />
                    <button type="submit">➔</button>
                </form>
                <Link to={"/login"}>Login</Link>
            </div>
        </div>
    );
}
