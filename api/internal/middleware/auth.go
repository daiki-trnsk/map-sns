package middleware

import (
	"net/http"

	token "github.com/daiki-trnsk/map-sns/internal/tokens"
	"github.com/labstack/echo/v4"
)

// 認証が絶対必要な処理はトークンがない場合エラー返す
func Authentication(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ClientToken := c.Request().Header.Get("Authorization")
		if ClientToken == "" {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "No Authorization Header Provided"})
		}
		claims, err := token.ValidateToken(ClientToken)
		if err != "" {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err})
		}
		c.Set("email", claims.Email)
		c.Set("uid", claims.Uid)
		return next(c)
	}
}

// 認証の有無で処理が分かれる場合にトークンの有無確認とid取得
func OptionalAuthentication(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ClientToken := c.Request().Header.Get("Authorization")
		if ClientToken == "" {
			return next(c)
		}
		claims, err := token.ValidateToken(ClientToken)
		if err != "" {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err})
		}
		c.Set("email", claims.Email)
		c.Set("uid", claims.Uid)
		return next(c)
	}
}