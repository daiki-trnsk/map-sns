import React, { useState, useContext } from "react";
import { API_HOST } from "../common";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function SignUp() {
    const { setIsLoggedIn } = useContext(AuthContext);

    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (
            !nickname.trim() ||
            !email.trim() ||
            !password.trim() ||
            !password.trim()
        ) {
            alert("全ての項目を入力してください");
            return;
        }

        const isValidEmail = (email: string) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        };

        if (!isValidEmail(email)) {
            alert("メールアドレスの形式が誤っています");
            return;
        }

        if (password !== passwordConfirm) {
            alert("パスワードが一致しません");
            return;
        }

        if (password.length < 6) {
            alert("パスワードは6文字以上で入力してください");
            return;
        }

        setIsLoading(true);

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
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to sign up");
            }
            const data = await res.json();
            setToken(data.token);
            setIsLoggedIn(data);

            setNickname("");
            setEmail("");
            setPassword("");

            navigate("/");
        } catch (error: any) {
            console.error(error);
            alert(`サインアップに失敗しました: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="auth-logo">
                    <img src={logo} alt="logo" className="logo-img" />
                </div>
                <div className="auth-info">
                    <p>お気に入りの場所をシェアしよう</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
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
                        placeholder="password"
                        maxLength={500}
                        required
                    />
                    <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="password (confirm)"
                        maxLength={500}
                        required
                    />
                    <Link to={"/login"} className="register-link">
                        Login
                    </Link>

                    {isLoading ? (
                        <div className="spinner-box">
                            <div className="three-quarter-spinner"></div>
                        </div>
                    ) : (
                        <button type="submit" disabled={isLoading}>
                            ➔
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
