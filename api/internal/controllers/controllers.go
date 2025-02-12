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
	topicCollection *mongo.Collection
	postCollection *mongo.Collection
	commentCollection *mongo.Collection
}

func NewApplication(topicCollection, postCollection, commentCollection *mongo.Collection) *Application {
	return &Application{
		topicCollection: topicCollection,
		postCollection: postCollection,
		commentCollection: commentCollection,
	}
}

func (app *Application) GetTopics(c echo.Context) error {
	var topics []models.Topic
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	cursor, err := app.topicCollection.Find(ctx, bson.M{})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Someting Went Wrong Please Try After Some Time")
	}
	err = cursor.All(ctx, &topics)
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "Error occurred while fetching topics")
	}
	defer cursor.Close(ctx)
	err = cursor.Err()
	if err != nil {
		log.Println(err)
		return c.JSON(http.StatusInternalServerError, "invalid")
	}
	return c.JSON(http.StatusOK, topics)
}

func (app *Application) CreateTopic(c echo.Context) error {
	var topic models.Topic
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	if err := c.Bind(&topic); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	topic.ID = primitive.NewObjectID()
	_, err := app.topicCollection.InsertOne(ctx, topic)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Not Created")
	}
	return c.JSON(http.StatusOK, "Successfully Created Topic")
}