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
	"golang.org/x/crypto/bcrypt"

	"github.com/daiki-trnsk/map-sns/internal/models"
	generate "github.com/daiki-trnsk/map-sns/internal/tokens"
	"github.com/daiki-trnsk/map-sns/pkg/database"
)

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
	return c.JSON(http.StatusCreated, user)
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