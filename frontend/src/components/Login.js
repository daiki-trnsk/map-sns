import React, { useState, useContext } from "react";
import { API_HOST } from "../common";
import { setToken } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "./UI/Header";

export default function Login() {
    const { setIsLoggedIn, checkAuth } = useContext(AuthContext);

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            alert("タイトルと説明を入力してください！");
            return;
        }

        setIsLoading(true);

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
            console.log("login res:", data);
            setToken(data.token);
            const auth = await checkAuth();
            console.log("login auth:", auth);
            setIsLoggedIn(auth);

            setEmail("");
            setPassword("");

            navigate("/");
        } catch (error) {
            console.error("error:", error);
            alert("ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="auth-info">
                    <Header />
                    <p>お気に入りの場所をシェアしよう</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        className="email-input"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="メールアドレス"
                        maxLength={500}
                        required
                    />
                    <input
                        className="pwd-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="パスワード"
                        maxLength={500}
                        required
                    />
                    <Link to={"/register"} className="register-link">
                        Sign Up
                    </Link>

                    {isLoading ? (
                        <div class="spinner-box">
                            <div class="three-quarter-spinner"></div>
                        </div>
                    ) : (
                        <button type="submit" disabled={isLoading}>
                            ➜
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
