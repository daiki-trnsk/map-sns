package token

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/daiki-trnsk/map-sns/pkg/database"

	jwt "github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SignedDetails struct {
	Email    string
	Nickname string
	Uid      string
	jwt.StandardClaims
}

var UserData *mongo.Collection = database.UserData(database.Client, "Users")
var SECRET_KEY = os.Getenv("SECRET_LOVE")

func TokenGenerator(email string, nickname string, uid string) (signedtoken string, signedrefreshtoken string, err error) {
	fmt.Println("Now:", time.Now())
	fmt.Println("Now.Local:", time.Now().Local())
	fmt.Println("UNIX:", time.Now().Unix())
	claims := &SignedDetails{
		Email:    email,
		Nickname: nickname,
		Uid:      uid,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Local().Add(time.Hour * time.Duration(24)).Unix(),
		},
	}
	refreshclaims := &SignedDetails{
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Local().Add(time.Hour * time.Duration(168)).Unix(),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(SECRET_KEY))
	if err != nil {
		return "", "", err
	}
	refreshtoken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshclaims).SignedString([]byte(SECRET_KEY))
	if err != nil {
		log.Panicln(err)
		return
	}
	return token, refreshtoken, err
}

func ValidateToken(signedtoken string) (claims *SignedDetails, msg string) {
	tokenString := signedtoken
	if len(signedtoken) > 7 && signedtoken[:7] == "Bearer " {
		tokenString = signedtoken[7:]
	}
	token, err := jwt.ParseWithClaims(tokenString, &SignedDetails{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(SECRET_KEY), nil
	})

	if err != nil {
		msg = err.Error()
		fmt.Println("token is expired4", claims, msg)
		return
	}
	claims, ok := token.Claims.(*SignedDetails)
	if !ok {
		msg = "The Token is invalid"
		fmt.Println("token is expired1")
		return
	}
	if claims.ExpiresAt < time.Now().Local().Unix() {
		msg = "token is expired"
		fmt.Println("token is expired2")
		return
	}
	fmt.Println("token is expired3", claims, msg)
	return claims, msg
}

func UpdateAllTokens(signedtoken string, signedrefreshtoken string, userid string) {
	var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
	var updateobj primitive.D
	updateobj = append(updateobj, bson.E{Key: "token", Value: signedtoken})
	updateobj = append(updateobj, bson.E{Key: "refresh_token", Value: signedrefreshtoken})
	updated_at, _ := time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
	updateobj = append(updateobj, bson.E{Key: "updatedat", Value: updated_at})
	upsert := true
	filter := bson.M{"user_id": userid}
	opt := options.UpdateOptions{
		Upsert: &upsert,
	}
	_, err := UserData.UpdateOne(ctx, filter, bson.D{
		{Key: "$set", Value: updateobj},
	},
		&opt)
	defer cancel()
	if err != nil {
		log.Panic(err)
		return
	}

}
