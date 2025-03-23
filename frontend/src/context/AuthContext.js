import React, { createContext, useEffect, useState } from "react";
import { getToken, isToken, removeToken } from "../utils/auth";
import { API_HOST } from "../common";

const initialState = {
    isLoggedIn: false,
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);

    const checkAuth = async () => {
        if (isToken()) {
            try {
                const res = await fetch(`${API_HOST}/me`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `${getToken()}`,
                    },
                });
                const data = await res.json();
                if (res.ok) {
                    return data;
                } else {
                    throw new Error(res.status + " " + data.error);
                }
            } catch (err) {
                if (err.message && err.message.includes("expired")) {
                    console.log("err:", err);
                    removeToken();
                }
                // リフレッシュトークン関係実装するまで仮に期限切れのときトークン消す
                return null;
            }
        } else {
            // console.log("isTokenfalse");
            return null;
        }
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            const auth = await checkAuth();
            // console.log("auth", auth);
            setIsLoggedIn(auth);
        };

        checkAuthentication();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
