import React from "react";
import Login from "../components/Login";
import Header from "../components/UI/header";

export default function Auth() {
    return (
        <div className="full-view">
            <Header />
            <Login />
        </div>
    );
}
