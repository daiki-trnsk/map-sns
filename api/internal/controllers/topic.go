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
)

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
	return c.JSON(http.StatusOK, topiclist)
}

// トピックの作成
func (app *Application) CreateTopic(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	if err := c.Bind(&topic); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	topic.ID = primitive.NewObjectID()
	topic.Created_At = time.Now()
	topic.UserID = c.Get("uid").(string)
	_, err := app.topicCollection.InsertOne(ctx, topic)
	if err != nil {
		log.Println("Error inserting topic:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create topic")
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
