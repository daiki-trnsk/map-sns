import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import home from "../../assets/home.png";
import account from "../../assets/account.png";
import topicCreate from "../../assets/topicCreate.png";

export default function Footer() {
    const { isLoggedIn } = useContext(AuthContext);

    return (
        <div className="header">
            <div className="header-left">
                <Link to={"/"}>
                    <img src={home} className="home-img"/>
                </Link>
            </div>
            <div className="header-center">
                <img src={topicCreate} className="topic-create-img" />
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    <Link to={"/user"}>
                        <img src={account} className="account-img" />
                    </Link>
                ) : (
                    <Link to={"/login"}>
                        <h3>Login</h3>
                    </Link>
                )}
            </div>
        </div>
    );
}
