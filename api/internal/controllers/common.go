package controllers

import (
	"fmt"
	"time"

	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/mongo"
	)

// あとでappメソッドはtopic,post,commentで分割する
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
	fmt.Println(c.JSON(status, map[string]string{"error": message}))
	return c.JSON(status, map[string]string{"error": message})
}


var Validate = validator.New()