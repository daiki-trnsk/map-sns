package controllers

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/subscription"
	"github.com/stripe/stripe-go/v74/webhook"

	"github.com/daiki-trnsk/map-sns/internal/models"
)

type stripeSessionResponse struct {
	Url string `json:"url"`
}

// Stripe Checkout セッション作成
func (app *Application) CreateCheckoutSession(c echo.Context) error {
	userID, ok := c.Get("uid").(string)
	if !ok || userID == "" {
		return errorResponse(c, http.StatusBadRequest, "user_id required")
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	domain := os.Getenv("APP_DOMAIN") // e.g. https://your-frontend.example

	// 既にダッシュボードで作成した定期課金用 Price ID を指定（例: price_1SobtNILsYspVlLVvBiqQRXX）
	priceID := "price_1SobtNILsYspVlLVvBiqQRXX" // ←あなたの実際の price ID に置き換えてください

	params := &stripe.CheckoutSessionParams{
		Params: stripe.Params{
			Metadata: map[string]string{
				"user_id": userID,
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(domain + "/?checkout=success"),
		CancelURL:  stripe.String(domain + "/?checkout=cancel"),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
	}

	s, err := session.New(params)
	if err != nil {
		log.Println("stripe session create err:", err)
		return errorResponse(c, http.StatusInternalServerError, "failed to create stripe session")
	}
	return c.JSON(http.StatusOK, stripeSessionResponse{Url: s.URL})
}

// Stripe webhook: checkout.session.completed を受けてユーザー更新
func (app *Application) HandleStripeWebhook(c echo.Context) error {
	const MaxBodyBytes = int64(65536)
	req := c.Request()
	req.Body = http.MaxBytesReader(c.Response(), req.Body, MaxBodyBytes)
	payload, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return c.String(http.StatusServiceUnavailable, "error reading request body")
	}

	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	sigHeader := c.Request().Header.Get("Stripe-Signature")

	// API バージョン mismatch をローカルで無視して受け取る（検証環境向け）
	event, err := webhook.ConstructEventWithOptions(payload, sigHeader, endpointSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Println("webhook verify failed:", err)
		return c.String(http.StatusBadRequest, "webhook verify failed")
	}

	if event.Type == "checkout.session.completed" {
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			log.Println("unmarshal session err:", err)
			return c.String(http.StatusBadRequest, "bad request")
		}
		userID := sess.Metadata["user_id"]
		if userID == "" {
			return c.String(http.StatusOK, "no user")
		}

		// Customer / Subscription が nil の可能性を考慮して安全に取り出す
		var customerID, subscriptionID string
		if sess.Customer != nil {
			customerID = sess.Customer.ID
		}
		if sess.Subscription != nil {
			subscriptionID = sess.Subscription.ID
		}

		// ユーザーを更新（IsSubscribed 等）
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		update := bson.M{
			"$set": bson.M{
				"is_subscribed":           true,
				"subscribed_at":           time.Now(),
				"subscription_period_end": time.Now().AddDate(0, 1, 0), // 1ヶ月など
				"subscription_status":     "active",
				"stripe_customer_id":      customerID,
				"stripe_subscription_id":  subscriptionID,
			},
		}
		_, uerr := UserCollection.UpdateOne(ctx, bson.M{"user_id": userID}, update, options.Update().SetUpsert(false))
		if uerr != nil {
			log.Println("failed update user subscription:", uerr)
		}
	}
	return c.String(http.StatusOK, "received")
}

// サブスクリプション解約（ユーザーページから呼ぶ）
func (app *Application) CancelSubscription(c echo.Context) error {
	var ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID, ok := c.Get("uid").(string)
	if !ok || userID == "" {
		return errorResponse(c, http.StatusBadRequest, "user_id required")
	}

	var user models.User
	if err := UserCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&user); err != nil {
		log.Println("failed to find user for cancel:", err)
		return errorResponse(c, http.StatusInternalServerError, "failed to find user")
	}

	if user.StripeSubscriptionID == "" {
		// サブスク情報が無ければ単にフラグを下げる
		_, _ = UserCollection.UpdateOne(ctx, bson.M{"user_id": userID}, bson.M{"$set": bson.M{"is_subscribed": false, "subscription_status": "canceled"}}, options.Update().SetUpsert(false))
		return c.JSON(http.StatusOK, map[string]string{"status": "canceled"})
	}

	// Stripe API キー設定
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	_, err := subscription.Cancel(user.StripeSubscriptionID, nil)
	if err != nil {
		log.Println("stripe cancel err:", err)
		// DB上は取り急ぎステータス更新はしない
		return errorResponse(c, http.StatusInternalServerError, "failed to cancel subscription")
	}

	update := bson.M{
		"$set": bson.M{
			"is_subscribed":           false,
			"subscription_status":     "canceled",
			"subscription_period_end": time.Now(), // 任意
		},
	}
	_, uerr := UserCollection.UpdateOne(ctx, bson.M{"user_id": userID}, update, options.Update().SetUpsert(false))
	if uerr != nil {
		log.Println("failed update user after cancel:", uerr)
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "canceled"})
}
