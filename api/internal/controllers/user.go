package controllers

import (
	"context"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/daiki-trnsk/map-sns/internal/models"
)

type UserDataResponse struct {
	User        models.User    `json:"user"`
	Topics      []models.Topic `json:"topics"`
	LikedTopics []TopicWithUserInfo `json:"liked_topics"`
}

// ユーザー情報、ユーザーの投稿取得
// いいね実装後、いいねした投稿一覧の取得ここで実装
// あとで処理ごとに関数分ける
func (app *Application) GetUserData(c echo.Context) error {
	currentUserID := c.Get("uid").(string)
	objectID, err := primitive.ObjectIDFromHex(currentUserID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid User ID")
	}

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var user models.User
	filter := bson.M{"_id": objectID}
	err = UserCollection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		log.Println("Failed to find user:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to find user")
	}

	var userTopics []models.Topic

	filter = bson.M{"user_id": currentUserID}
	cursor, err := app.topicCollection.Find(ctx, filter)
	if err != nil {
		log.Println("Error finding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to fetch topics")
	}
	defer cursor.Close(ctx)
	err = cursor.All(ctx, &userTopics)
	if err != nil {
		log.Println("Error decoding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to decode topics")
	}

	var likedTopics []models.Topic
	filter = bson.M{"liked_users": bson.M{"$in": []string{currentUserID}}}
	cursor, err = app.topicCollection.Find(ctx, filter)
	if err != nil {
		log.Println("Error finding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to fetch topics")
	}
	defer cursor.Close(ctx)
	err = cursor.All(ctx, &likedTopics)
	if err != nil {
		log.Println("Error decoding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to decode topics")
	}

	likedTopicsWithUserInfo, err := getUserInfoForTopics(likedTopics, currentUserID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "Failed to get user names")
	}

	response := UserDataResponse{
		User:        user,
		Topics:      userTopics,
		LikedTopics: likedTopicsWithUserInfo,
	}

	return c.JSON(http.StatusOK, response)
}
