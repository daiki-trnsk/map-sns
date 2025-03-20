package repositories

import (
	"context"
	"log"

	// "net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	// "github.com/daiki-trnsk/map-sns/internal/controllers"
	"github.com/daiki-trnsk/map-sns/internal/models"
	"github.com/daiki-trnsk/map-sns/pkg/database"
)

var UserCollection *mongo.Collection = database.UserData(database.Client, "Users")

func GetUserNameByID(id string) (string, error) {
	if id == "" {
		return "匿名", nil
	}
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return "", err
	}

	var ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User

	filter := bson.M{"_id": objectID}
	err = UserCollection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		log.Println("Failed to find user:", err)
		return "", err
	}
	if user.Nickname == nil {
		return "", nil
	}
	return *user.Nickname, nil
}
