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

// ポスト一覧の取得
func (app *Application) GetPostList(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var postlist []models.Post
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	filter := bson.M{"topic_id": objectID}
	cursor, err := app.postCollection.Find(ctx, filter)
	if err != nil {
		log.Println("Error finding posts:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to fetch posts")
	}
	defer cursor.Close(ctx)
	err = cursor.All(ctx, &postlist)
	if err != nil {
		log.Println("Error decoding posts:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to decode posts")
	}
	return c.JSON(http.StatusOK, postlist)
}

// ポストの作成
func (app *Application) CreatePost(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var post models.Post
	topicID := c.Param("id")
	if err := c.Bind(&post); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	post.ID = primitive.NewObjectID()
	post.Topic_ID = objectID
	post.Created_At = time.Now()
	post.UserID = c.Get("uid").(string)
	_, err = app.postCollection.InsertOne(ctx, post)
	if err != nil {
		log.Println("Error inserting post:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create post")
	}
	return c.JSON(http.StatusCreated, post)
}

// ポストの編集
func (app *Application) EditPost(c echo.Context) error {
	postID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var post models.Post
	if err := c.Bind(&post); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	post.Updated_At = time.Now()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	update := bson.M{
		"$set": bson.M{
			"post_title":  post.Post_Title,
			"description": post.Description,
			"updated_at":  post.Updated_At,
		},
	}
	err = app.postCollection.FindOneAndUpdate(ctx, filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&post)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Post not found or Not your Post")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to update post")
	}
	return c.JSON(http.StatusOK, post)
}

// ポストの削除
func (app *Application) DeletePost(c echo.Context) error {
	postID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	err = app.postCollection.FindOneAndDelete(ctx, filter).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Post not found or Not your post")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to delete post")
	}
	return c.NoContent(http.StatusNoContent)
}
