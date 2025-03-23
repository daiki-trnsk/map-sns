package controllers

import (
	"context"
	"fmt"
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

type PostWithUserInfo struct {
	models.Post
	NickName string `json:"nickname"`
	IsLiked  bool   `json:"is_liked"`
}

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

	userID := c.Get("uid")
	userIDStr, ok := userID.(string)
	if !ok {
		if userIDStr != "" {
			return errorResponse(c, http.StatusInternalServerError, "Failed to get user ID")
		}
	}

	postlistWithUserInfo, err := getUserNameForPosts(postlist, userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "Failed to get user names")
	}
	return c.JSON(http.StatusOK, postlistWithUserInfo)
}

// ピン作成者のニックネーム取得
func getUserNameForPosts(posts []models.Post, userID string) ([]PostWithUserInfo, error) {
	var postsWithUserName []PostWithUserInfo
	for _, post := range posts {
		// ピン作成者のニックネーム取得
		nickName, err := repositories.GetUserNameByID(post.UserID)
		if err != nil {
			return nil, err
		}
		// クライアントがいいねしているか
		isLiked := false
		if userID != "" {
			if contains(post.LikedUsers, userID) {
				isLiked = true
			}
		}

		postsWithUserName = append(postsWithUserName, PostWithUserInfo{
            Post:    post,
            NickName: nickName,
			IsLiked:  isLiked,
        })
	}
	return postsWithUserName, nil
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

// ポストいいね操作
func (app *Application) LikePost(c echo.Context) error {
	postID := c.Param("id")
	fmt.Println("postID", postID)
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Post ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var post models.Post
	filter := bson.M{"_id": objectID}
	err = app.postCollection.FindOne(ctx, filter).Decode(&post)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errorResponse(c, http.StatusForbidden, "Post not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "Failed to find post")
	}

	if c.Request().Method == "POST" {
		if contains(post.LikedUsers, currentUserID) {
			return errorResponse(c, http.StatusConflict, "Already liked")
		}
		post.LikedUsers = append(post.LikedUsers, currentUserID)
		post.LikeCount++
	} else if c.Request().Method == "DELETE" {
		if !contains(post.LikedUsers, currentUserID) {
			return errorResponse(c, http.StatusConflict, "Not liked yet")
		}
		post.LikedUsers = remove(post.LikedUsers, currentUserID)
		post.LikeCount--
	}

	update := bson.M{
		"$set": bson.M{
			"liked_users": post.LikedUsers,
			"like_count":  post.LikeCount,
		},
	}
	err = app.postCollection.FindOneAndUpdate(ctx, filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&post)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "Failed to update topic")
	}
	return c.JSON(http.StatusOK, post)
}