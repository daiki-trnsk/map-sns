interface Topic {
    id: string;
    topic_title: string;
    description: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    liked_users: string[] | null;
    like_count: number;
    nickname?: string;
    is_liked: boolean;
}
