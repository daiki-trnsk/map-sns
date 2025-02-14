package controllers

import (
	"context"
	"fmt"
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

func NewApplication(topicCollection, postCollection, commentCollection *mongo.Collection) *Application {
	return &Application{
		topicCollection:   topicCollection,
		postCollection:    postCollection,
		commentCollection: commentCollection,
	}
}

func (app *Application) GetTopicList(c echo.Context) error {
	var topiclist []models.Topic
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	cursor, err := app.topicCollection.Find(ctx, bson.M{})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Someting Went Wrong Please Try After Some Time")
	}
	err = cursor.All(ctx, &topiclist)
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "Error occurred while fetching topiclist")
	}
	defer cursor.Close(ctx)
	err = cursor.Err()
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "invalid")
	}
	return c.JSON(http.StatusOK, topiclist)
}

func (app *Application) CreateTopic(c echo.Context) error {
	var topic models.Topic
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	if err := c.Bind(&topic); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	topic.ID = primitive.NewObjectID()
	topic.Created_At, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	_, err := app.topicCollection.InsertOne(ctx, topic)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Not Created")
	}
	return c.JSON(http.StatusOK, "Successfully Created Topic")
}

func (app *Application) GetPostList(c echo.Context) error {
	var postlist []models.Post
	topicID := c.Param("id")
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid Topic ID")
	}
	filter := bson.M{"topic_id": objectID}
	cursor, err := app.postCollection.Find(ctx, filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Someting Went Wrong Please Try After Some Time")
	}
	err = cursor.All(ctx, &postlist)
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "Error occurred while fetching postlist")
	}
	defer cursor.Close(ctx)
	err = cursor.Err()
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "invalid")
	}
	return c.JSON(http.StatusOK, postlist)
}

func (app *Application) CreatePost(c echo.Context) error {
	var post models.Post
	topicID := c.Param("id")
	fmt.Println("topicID", topicID)
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	if err := c.Bind(&post); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid Topic ID")
	}
	post.ID = primitive.NewObjectID()
	post.Topic_ID = objectID
	post.Created_At, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	_, err = app.postCollection.InsertOne(ctx, post)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Not Created")
	}
	return c.JSON(http.StatusOK, "Successfully Created Post")
}

func (app *Application) GetCommentList(c echo.Context) error {
	var commentlist []models.Comment
	postID := c.Param("id")
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid Post ID")
	}
	filter := bson.M{"post_id": objectID}
	cursor, err := app.commentCollection.Find(ctx, filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Someting Went Wrong Please Try After Some Time")
	}
	err = cursor.All(ctx, &commentlist)
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "Error occurred while fetching commentlist")
	}
	defer cursor.Close(ctx)
	err = cursor.Err()
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "invalid")
	}
	return c.JSON(http.StatusOK, commentlist)
}

func (app *Application) CreateComment(c echo.Context) error {
	var comment models.Comment
	postID := c.Param("id")
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	if err := c.Bind(&comment); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	objectID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "Invalid Post ID")
	}
	comment.ID = primitive.NewObjectID()
	comment.Post_ID = objectID
	comment.Created_At, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	_, err = app.commentCollection.InsertOne(ctx, comment)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Not Created")
	}
	return c.JSON(http.StatusOK, "Successfully Created Comment")
}
