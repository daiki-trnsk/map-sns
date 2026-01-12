package controllers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/daiki-trnsk/map-sns/internal/models"
	"github.com/daiki-trnsk/map-sns/internal/repositories"
)

type TopicWithUserInfo struct {
	models.Topic
	NickName string `json:"nickname"`
	IsLiked  bool   `json:"is_liked"`
}

// トピック一覧の取得
func (app *Application) GetTopicList(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topiclist []models.Topic
	queryParam := c.QueryParam("title")
	filter := bson.M{}
	if queryParam != "" {
		filter = bson.M{"topic_title": bson.M{"$regex": queryParam, "$options": "i"}}
	}
	cursor, err := app.topicCollection.Find(ctx, filter)
	if err != nil {
		log.Println("Error finding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to fetch topics")
	}
	defer cursor.Close(ctx)
	err = cursor.All(ctx, &topiclist)

	if err != nil {
		log.Println("Error decoding topics:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to decode topics")
	}

	userID := c.Get("uid")
	userIDStr, ok := userID.(string)
	if !ok {
		if userIDStr != "" {
			return errorResponse(c, http.StatusInternalServerError, "Failed to get user ID")
		}
	}

	topiclistWithUserInfo, err := getUserInfoForTopics(topiclist, userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "Failed to get user names")
	}
	return c.JSON(http.StatusOK, topiclistWithUserInfo)
}

// トピックにニックネームと取得者がいいねしているかの情報を追加
func getUserInfoForTopics(topics []models.Topic, userID string) ([]TopicWithUserInfo, error) {
	var topicsWithUserInfo []TopicWithUserInfo
	for _, topic := range topics {
		// トピック作成者のユーザーネームの取得
		nickName, err := repositories.GetUserNameByID(topic.UserID)
		if err != nil {
			return nil, err
		}
		// クライアントがいいねしているか
		isLiked := false
		if userID != "" {
			if contains(topic.LikedUsers, userID) {
				isLiked = true
			}
		}

		topicsWithUserInfo = append(topicsWithUserInfo, TopicWithUserInfo{
			Topic:    topic,
			NickName: nickName,
			IsLiked:  isLiked,
		})
	}
	return topicsWithUserInfo, nil
}

// トピックの作成
func (app *Application) CreateTopic(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	if err := c.Bind(&topic); err != nil {
		return errorResponse(c, http.StatusBadRequest, "invalid request payload")
	}

	// 認証ミドルウェア下で呼ばれる想定なので uid を利用
	userID, ok := c.Get("uid").(string)
	if !ok || userID == "" {
		return errorResponse(c, http.StatusBadRequest, "user_id required")
	}

	// ユーザーの既存Topic数をカウント
	count, err := app.topicCollection.CountDocuments(ctx, bson.M{"user_id": userID})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "failed to count topics")
	}

	// 4件以上はサブスク要件をチェック
	if count >= 4 {
		var user models.User
		// controllers パッケージの UserCollection を利用
		err := UserCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&user)
		// ユーザー未取得 or サブスク未加入なら作成拒否（HTTP 402: Payment Required）
		if err != nil || !user.IsSubscribed {
			return c.JSON(http.StatusPaymentRequired, map[string]string{"error": "free topic limit reached (4). subscribe to create more."})
		}
	}

	// 続けてTopic作成処理（既存ロジックへ）
	topic.ID = primitive.NewObjectID()
	topic.UserID = userID
	topic.Created_At = time.Now()
	topic.Updated_At = time.Now()

	if _, err := app.topicCollection.InsertOne(ctx, topic); err != nil {
		log.Println("failed to create topic:", err)
		return errorResponse(c, http.StatusInternalServerError, "failed to create topic")
	}

	return c.JSON(http.StatusCreated, topic)
}

// トピックの編集
func (app *Application) EditTopic(c echo.Context) error {
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	if err := c.Bind(&topic); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	topic.Updated_At = time.Now()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	update := bson.M{
		"$set": bson.M{
			"topic_title": topic.Topic_Title,
			"description": topic.Description,
			"updated_at":  topic.Updated_At,
		},
	}
	err = app.topicCollection.FindOneAndUpdate(ctx, filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&topic)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Topic not found or Not your topic")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to update topic")
	}
	return c.JSON(http.StatusOK, topic)
}

// トピックの削除
func (app *Application) DeleteTopic(c echo.Context) error {
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	err = app.topicCollection.FindOneAndDelete(ctx, filter).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Topic not found or Not your topic")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to delete topic")
	}
	return c.NoContent(http.StatusNoContent)
}

// トピックお気に入り操作
func (app *Application) LikeTopic(c echo.Context) error {
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	filter := bson.M{"_id": objectID}
	err = app.topicCollection.FindOne(ctx, filter).Decode(&topic)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Topic not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to find topic")
	}

	if c.Request().Method == "POST" {
		if contains(topic.LikedUsers, currentUserID) {
			return errorResponse(c, http.StatusConflict, "Already liked")
		}
		topic.LikedUsers = append(topic.LikedUsers, currentUserID)
		topic.LikeCount++
	} else if c.Request().Method == "DELETE" {
		if !contains(topic.LikedUsers, currentUserID) {
			return errorResponse(c, http.StatusConflict, "Not liked yet")
		}
		topic.LikedUsers = remove(topic.LikedUsers, currentUserID)
		topic.LikeCount--
	}

	update := bson.M{
		"$set": bson.M{
			"liked_users": topic.LikedUsers,
			"like_count":  topic.LikeCount,
		},
	}
	err = app.topicCollection.FindOneAndUpdate(ctx, filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&topic)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "Failed to update topic")
	}
	return c.JSON(http.StatusOK, topic)
}
