package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ユーザー認証は初期リリース後に実装する
// よって投稿の更新、削除、いいね機能も初期リリースでは実装しない
// type User struct{

// }

type Topic struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Topic_Title string             `bson:"topic_title" json:"topic_title"`
	Description string             `bson:"description" json:"description"`
	Created_At  time.Time          `bson:"created_at" json:"created_at"`
}

type Location struct {
	Lat float64 `bson:"lat" json:"lat"`
	Lng float64 `bson:"lng" json:"lng"`
}

type Post struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Topic_ID    primitive.ObjectID `bson:"topic_id" json:"topic_id"`
	Post_Title  string             `bson:"post_title" json:"post_title"`
	Description string             `bson:"description" json:"description"`
	ImageURL    string             `bson:"imageUrl" json:"imageUrl"`
	Location    Location           `bson:"location" json:"location"`
	Created_At  time.Time          `bson:"created_at" json:"created_at"`
}

type Comment struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Post_ID    primitive.ObjectID `bson:"post_id" json:"post_id"`
	Text       string             `bson:"text" json:"text"`
	Created_At time.Time          `bson:"created_at" json:"created_at"`
}
