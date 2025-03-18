import React from "react";
import logo from "../../assets/logo.png";

export default function Header() {
    return (
        <div className="app-title">
            <img src={logo} className="logo-img" />
        </div>
    );
}
