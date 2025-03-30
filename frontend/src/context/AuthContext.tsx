import React, { createContext, useEffect, useState, ReactNode } from "react";
import { getToken, isToken, removeToken } from "../utils/auth";
import { API_HOST } from "../common";
import { UserData } from "../types/user";

interface AuthContextType {
    isLoggedIn: boolean | UserData | null;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    checkAuth: () => Promise<any | null>;
}

// const initialState: Omit<AuthContextType, "setIsLoggedIn" | "checkAuth"> = {
//     isLoggedIn: false,
// };
const initialState = {
    isLoggedIn: false,
};

export const AuthContext = createContext<AuthContextType>({
    ...initialState,
    setIsLoggedIn: () => {},
    checkAuth: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn );

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
                if (err instanceof Error && err.message.includes("expired")) {
                    console.log("err:", err);
                    removeToken();
                }
                // リフレッシュトークン関係実装するまで仮に期限切れのときトークン消す
                return null;
            }
        } else {
            return null;
        }
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            const auth = await checkAuth();
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
