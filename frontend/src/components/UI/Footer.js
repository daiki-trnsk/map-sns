import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import home from "../../assets/home.png";
import account from "../../assets/account.png";
import topicCreate from "../../assets/topicCreate.png";
import login from "../../assets/login.png";
import login2 from "../../assets/login2.png";

export default function Footer() {
    const { isLoggedIn } = useContext(AuthContext);

    return (
        <div className="header">
            <div className="header-left">
                <Link to={"/"}>
                    <img src={home} className="home-img" />
                </Link>
            </div>
            <div className="header-center">
                {isLoggedIn && (
                    <Link to={"/create"}>
                        <img src={topicCreate} className="topic-create-img" />
                    </Link>
                )}
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    <Link to={"/user"}>
                        <img src={account} className="account-img" />
                    </Link>
                ) : (
                    <Link to={"/login"}>
                        <img src={login} className="login-img" />
                    </Link>
                )}
            </div>
        </div>
    );
}
