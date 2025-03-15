import React from "react";
import TopicList from "../components/TopicList";
import Header from "../components/UI/header";

export default function Home() {
    // 最初にfalseが出力され、trueの場合はまた出力されるなぜか。挙動を後で確認

    return (
        <>
            <Header />
            <TopicList />
        </>
    );
}
