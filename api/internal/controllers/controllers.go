package controllers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/daiki-trnsk/map-sns/internal/models"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Application struct {
	topicCollection   *mongo.Collection
	postCollection    *mongo.Collection
	commentCollection *mongo.Collection
}

const queryTimeout = 10 * time.Second

func NewApplication(topicCollection, postCollection, commentCollection *mongo.Collection) *Application {
	return &Application{
		topicCollection:   topicCollection,
		postCollection:    postCollection,
		commentCollection: commentCollection,
	}
}

func errorResponse(c echo.Context, status int, message string) error {
	return c.JSON(status, map[string]string{"error": message})
}

func (app *Application) GetTopicList(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topiclist []models.Topic
	cursor, err := app.topicCollection.Find(ctx, bson.M{})
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

func (app *Application) CreateTopic(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	if err := c.Bind(&topic); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	topic.ID = primitive.NewObjectID()
	topic.Created_At = time.Now()
	_, err := app.topicCollection.InsertOne(ctx, topic)
	if err != nil {
		log.Println("Error inserting topic:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create topic")
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Successfully created topic"})
}

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
	_, err = app.postCollection.InsertOne(ctx, post)
	if err != nil {
		log.Println("Error inserting post:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create post")
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Successfully created post"})
}

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
	
	_, err = app.commentCollection.InsertOne(ctx, comment)
	if err != nil {
		log.Println("Error inserting comment:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create comment")
	}
	return c.JSON(http.StatusCreated, map[string]string{"message": "Successfully created comment"})
}
