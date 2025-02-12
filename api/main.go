package main

import (
	"log"
	"os"

	"github.com/labstack/echo/v4"

	"github.com/daiki-trnsk/map-sns/internal/controllers"
	// "github.com/daiki-trnsk/map-sns/internal/routes"
	"github.com/daiki-trnsk/map-sns/pkg/config"
	"github.com/daiki-trnsk/map-sns/pkg/database"
)

func main() {
	config.LoadEnv()

	database.Client = database.DBSet()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	app := controllers.NewApplication(
		database.TopicData(database.Client, "Topics"), 
		database.PostData(database.Client, "Posts"), 
		database.CommentData(database.Client, "Comments"),
	)

	e := echo.New()

	auth := e.Group("")
	// トピック検索機能入れる、検索のエンドポイントは一覧取得と共通化する？
	auth.GET("/topics", app.GetTopics)
	auth.POST("/topics", app.CreateTopic)
	auth.GET("/topics/:id", app.GetPosts)
	auth.POST("/topics/:id", app.CreatePost)
	auth.GET("/posts/:id", app.GetPostContents)
	auth.POST("/posts/:id/comments", app.CreateComment)

	log.Fatal(e.Start(":" + port))
}
