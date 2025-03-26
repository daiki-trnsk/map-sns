import React from "react";
import TopicList from "../components/TopicList";
import Footer from "../components/UI/Footer";
import Header from "../components/UI/Header";

export default function Home() {
    // 最初にfalseが出力され、trueの場合はまた出力されるなぜか。挙動を後で確認

    return (
        <>
            <Header />
            <TopicList />
            <Footer />
        </>
    );
}
