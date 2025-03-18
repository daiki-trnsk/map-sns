import React from "react";
import Login from "../components/Login";
import Footer from "../components/UI/Footer";
import Header from "../components/UI/Header";

export default function Auth() {
    return (
        <div className="full-view">
            <Header/>
            <Login />
            <Footer />
        </div>
    );
}
