interface Post {
    id: string;
    // post_消す
    post_title: string;
    topic_id: string;
    description: string;
    imageUrl: string;
    location: { lat: number; lng: number };
    created_at: string;
    updated_at: string;
    user_id: string;
    liked_users: string[] | null;
    like_count: number;
    nickname?: string;
    is_liked: boolean;
}