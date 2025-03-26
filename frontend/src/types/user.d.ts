import Topic from "./topic";

interface User {
    _id: string;
    nickname: string;
    password: string;
    email: string;
    token: string;
    refresh_token: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

interface UserData {
    user: User;
    topics: Topic;
    liked_topics: Topic;
}

interface UserInfoProps {
    userData: UserData;
}
