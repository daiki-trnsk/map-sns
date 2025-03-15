import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import home from "../../assets/home.png";
import account from "../../assets/account.png";

export default function Header() {
    const { isLoggedIn } = useContext(AuthContext);

    return (
        <div className="header">
            <div className="header-left">
                <Link to={"/"}>
                    <img src={home} className="home-img"/>
                </Link>
            </div>
            <div className="app-title">
                <img src={logo} className="logo-img" />
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    <Link to={"/user"}>
                        <img src={account} className="account-img" />
                    </Link>
                ) : (
                    <Link to={"/login"}>login</Link>
                )}
            </div>
        </div>
    );
}
