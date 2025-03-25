package main

import (
	"log"
	"os"

	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/echo/v4"

	"github.com/daiki-trnsk/map-sns/internal/controllers"
	customMiddleware "github.com/daiki-trnsk/map-sns/internal/middleware"
	// "github.com/daiki-trnsk/map-sns/internal/routes"
	"github.com/daiki-trnsk/map-sns/pkg/database"
)

func main() {
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
	
	optAuth := e.Group("")
	optAuth.Use(customMiddleware.OptionalAuthentication)
	
	// list取得系
	// 認証の有無で処理分け可能に
	optAuth.GET("/topics", app.GetTopicList)
	optAuth.GET("/topics/:id", app.GetPostList)
	optAuth.GET("/posts/:id", app.GetCommentList)

	auth := e.Group("")
	auth.Use(customMiddleware.Authentication)

	// トピック操作
	auth.POST("/topics", app.CreateTopic)
	auth.PUT("/topics/:id", app.EditTopic)
	auth.DELETE("/topics/:id", app.DeleteTopic)

	// トピックお気に入り操作
	auth.POST("/topics/:id/like", app.LikeTopic)
	auth.DELETE("/topics/:id/like", app.LikeTopic)

	// マップ内ポスト操作
	auth.POST("/topics/:id", app.CreatePost)
	auth.PUT("/posts/:id", app.EditPost)
	auth.DELETE("/posts/:id", app.DeletePost)

	// マップ内ポストいいね操作
	auth.POST("/posts/:id/like", app.LikePost)
	auth.DELETE("/posts/:id/like", app.LikePost)

	// コメント操作
	auth.POST("/posts/:id", app.CreateComment)
	auth.PUT("/comments/:id", app.EditComment)
	auth.DELETE("/comments/:id", app.DeleteComment) 

	// ユーザー情報取得
	auth.GET("/me", app.GetUserData)

	log.Fatal(e.Start(":" + port))
}
