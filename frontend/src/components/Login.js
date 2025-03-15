import React, { useState, useContext } from "react";
import { API_HOST } from "../common";
import { setToken } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
    const { setIsLoggedIn } = useContext(AuthContext);

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            alert("タイトルと説明を入力してください！");
            return;
        }
        const userData = {
            email: email,
            password: password,
        };
        try {
            const res = await fetch(`${API_HOST}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });
            if (!res.ok) {
                throw new Error("Failed to login");
            }
            const data = await res.json();
            // console.log("token:", data.token);
            setToken(data.token);
            setIsLoggedIn(data);

            setEmail("");
            setPassword("");

            navigate("/");
        } catch (error) {
            console.error("error:", error);
            alert("ログインに失敗しました");
        }
    };

    return (
        <div className="auth-container">
            <div className="login-form">
                <form onSubmit={handleSubmit} className="email-form">
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="メールアドレス"
                        maxLength={500}
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="パスワード"
                        maxLength={500}
                        required
                    />
                    <button type="submit">➔</button>
                </form>
                <Link to={"/register"}>Sign Up</Link>
            </div>
        </div>
    );
}
