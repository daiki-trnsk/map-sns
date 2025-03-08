package main

import (
	"log"
	"os"

	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/echo/v4"

	"github.com/daiki-trnsk/map-sns/internal/controllers"
	customMiddleware "github.com/daiki-trnsk/map-sns/internal/middleware"
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
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.HEAD},
    }))

	e.Any("/", func(c echo.Context) error {
		return c.String(200, "Map SNS API is running")
	})

	e.POST("/signup", controllers.SignUp)
	e.POST("/login", controllers.Login)
	
	// list取得
	e.GET("/topics", app.GetTopicList)
	e.GET("/topics/:id", app.GetPostList)
	e.GET("/posts/:id", app.GetCommentList)

	auth := e.Group("")
	// トピック検索機能入れる、検索のエンドポイントは一覧取得と共通化する？
	// 検索、ソート、フィルタリング、ページング制御でレイヤー化できるかも
	auth.Use(customMiddleware.Authentication)
	// トピックCRUD操作
	auth.POST("/topics", app.CreateTopic)
	auth.PUT("/topics/:id", app.EditTopic)
	auth.DELETE("/topics/:id", app.DeleteTopic)

	// マップ内ポストCRUD操作
	auth.POST("/topics/:id", app.CreatePost)
	auth.PUT("/posts/:id", app.EditPost)
	auth.DELETE("/posts/:id", app.DeletePost)

	// コメントCRUD操作
	auth.POST("/posts/:id", app.CreateComment)
	auth.PUT("/comments/:id", app.EditComment)
	auth.DELETE("/comments/:id", app.DeleteComment) 

	log.Fatal(e.Start(":" + port))
}
