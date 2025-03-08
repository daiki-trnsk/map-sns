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

// コメント一覧の取得
func (app *Application) GetCommentList(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var commentlist []models.Comment
	postID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}
	filter := bson.M{"post_id": objectID}
	cursor, err := app.commentCollection.Find(ctx, filter)
	if err != nil {
		log.Println("Error finding comments:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to fetch comments")
	}
	defer cursor.Close(ctx)
	err = cursor.All(ctx, &commentlist)
	if err != nil {
		log.Println("Error decoding comments:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to decode comments")
	}
	return c.JSON(http.StatusOK, commentlist)
}

// コメントの作成
func (app *Application) CreateComment(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var comment models.Comment
	postID := c.Param("id")
	if err := c.Bind(&comment); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}

	comment.ID = primitive.NewObjectID()
	comment.Post_ID = objectID
	comment.Created_At = time.Now()
	comment.UserID = c.Get("uid").(string)
	
	_, err = app.commentCollection.InsertOne(ctx, comment)
	if err != nil {
		log.Println("Error inserting comment:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create comment")
	}
	return c.JSON(http.StatusCreated, comment)
}

// コメントの編集
func (app *Application) EditComment(c echo.Context) error {
	commentID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(commentID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var comment models.Comment
	if err := c.Bind(&comment); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	comment.Updated_At = time.Now()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	update := bson.M{
		"$set": bson.M{
			"text": comment.Text,
			"updated_at":  comment.Updated_At,
		},
	}
	err = app.commentCollection.FindOneAndUpdate(ctx, filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&comment)
	if err != nil {
		if err == mongo.ErrNoDocuments { 
			return errorResponse(c, http.StatusForbidden, "Comment not found or Not your comment")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to update comment")
	}
	return c.JSON(http.StatusOK, comment)
}

// コメントの削除
func (app *Application) DeleteComment(c echo.Context) error {
	commentID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(commentID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Comment ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	filter := bson.M{
		"_id":     objectID,
		"user_id": currentUserID,
	}
	err = app.commentCollection.FindOneAndDelete(ctx, filter).Err()
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Comment not found or Not your comment")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to delete comment")
	}
	return c.NoContent(http.StatusNoContent)
}