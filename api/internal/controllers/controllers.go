package controllers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"github.com/daiki-trnsk/map-sns/internal/models"
	generate "github.com/daiki-trnsk/map-sns/internal/tokens"
	"github.com/daiki-trnsk/map-sns/pkg/database"
)

// 後で用途ごとにファイル分ける

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

var UserCollection *mongo.Collection = database.UserData(database.Client, "Users")

func HashPassword(password string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Panic(err)
	}
	return string(bytes)
}

func VerifyPassword(userpassword string, givenpassword string) (bool, string) {
	err := bcrypt.CompareHashAndPassword([]byte(givenpassword), []byte(userpassword))
	valid := true
	msg := ""
	if err != nil {
		msg = "Login Or Passowrd is Incorerct"
		valid = false
	}
	return valid, msg
}

func SignUp(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	var user models.User
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	validationErr := Validate.Struct(user)
	if validationErr != nil {
		fmt.Println("Validation Error:", validationErr)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": validationErr.Error()})
	}

	count, err := UserCollection.CountDocuments(ctx, bson.M{"email": user.Email})
	if err != nil {
		log.Panic(err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	if count > 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "User already exists"})
	}
	password := HashPassword(*user.Password)
	user.Password = &password

	user.Created_At, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	user.Updated_At, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	user.ID = primitive.NewObjectID()
	user.User_ID = user.ID.Hex()
	token, refreshtoken, err := generate.TokenGenerator(*user.Email, *user.Nickname, user.User_ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error generating tokens"})
	}
	user.Token = &token
	user.Refresh_Token = &refreshtoken
	_, inserterr := UserCollection.InsertOne(ctx, user)
	if inserterr != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "the user did not created"})
	}
	return c.JSON(http.StatusCreated, "Succesfully signed in!")
}

func Login(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()
	var user models.User
	var founduser models.User
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	err := UserCollection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&founduser)
	defer cancel()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "User not found"})
	}
	PasswordIsValid, msg := VerifyPassword(*user.Password, *founduser.Password)
	defer cancel()
	if !PasswordIsValid {
		fmt.Println(msg)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": msg})
	}
	token, refreshToken, _ := generate.TokenGenerator(*founduser.Email, *founduser.Nickname, founduser.User_ID)
	defer cancel()
	generate.UpdateAllTokens(token, refreshToken, founduser.User_ID)
	fmt.Println("founduser", http.StatusFound, founduser)
	return c.JSON(http.StatusOK, founduser)
}

func (app *Application) GetTopicList(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topiclist []models.Topic
	queryParam := c.QueryParam("title")
	filter := bson.M{}
	if queryParam != "" {
		filter = bson.M{"topic_title": bson.M{"$regex": queryParam, "$options": "i"}}
	}
	cursor, err := app.topicCollection.Find(ctx, filter)
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
	topic.UserID = c.Get("uid").(string)
	_, err := app.topicCollection.InsertOne(ctx, topic)
	if err != nil {
		log.Println("Error inserting topic:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create topic")
	}
	return c.JSON(http.StatusCreated, topic)
}

// トピックの編集
func (app *Application) EditTopic(c echo.Context) error {
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	var topic models.Topic
	if err := c.Bind(&topic); err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid request payload")
	}
	topic.Updated_At = time.Now()

	filter := bson.M{
        "_id":     objectID, 
        "user_id": currentUserID,
    }
	update := bson.M{
        "$set": bson.M{
            "topic_title": topic.Topic_Title,
            "description": topic.Description,
            "updated_at": topic.Updated_At,
        },
    }
	err = app.topicCollection.FindOneAndUpdate(ctx, filter, update,  options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&topic)
	if err != nil {
        if err == mongo.ErrNoDocuments {
            return errorResponse(c, http.StatusForbidden, "Topic not found or Not your topic")
        }
        return errorResponse(c, http.StatusInternalServerError, "Failed to update topic")
    }
	return c.JSON(http.StatusOK, topic)
}

// トピックの削除
func (app *Application) DeleteTopic(c echo.Context) error {
	topicID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(topicID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "Invalid Topic ID")
	}
	currentUserID := c.Get("uid").(string)

	var ctx, cancel = context.WithTimeout(context.Background(), queryTimeout)
	defer cancel()

	filter := bson.M{
        "_id":     objectID, 
        "user_id": currentUserID,
    }
	err = app.topicCollection.FindOneAndDelete(ctx, filter).Err()
	if err != nil {
        if err == mongo.ErrNoDocuments {
            return errorResponse(c, http.StatusForbidden, "Topic not found or Not your topic")
        }
        return errorResponse(c, http.StatusInternalServerError, "Failed to delete topic")
    }
    return c.NoContent(http.StatusNoContent)
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
	post.UserID = c.Get("uid").(string)
	_, err = app.postCollection.InsertOne(ctx, post)
	if err != nil {
		log.Println("Error inserting post:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create post")
	}
	return c.JSON(http.StatusCreated, post)
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
	comment.UserID = c.Get("uid").(string)
	
	_, err = app.commentCollection.InsertOne(ctx, comment)
	if err != nil {
		log.Println("Error inserting comment:", err)
		return errorResponse(c, http.StatusInternalServerError, "Failed to create comment")
	}
	return c.JSON(http.StatusCreated, comment)
}
