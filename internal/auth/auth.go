package auth

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/jwtauth/v5"
	"github.com/lestrrat-go/jwx/v2/jwt"
	"github.com/themintchoco/cvwo/internal/db"
)

type userIDContextKey struct{}

var tokenAuth *jwtauth.JWTAuth = jwtauth.New("HS256", []byte(os.Getenv("JWT_SECRET")), nil)

func Sign(userId uint) (string, error) {
	claims := map[string]any{"user_id": userId}
	jwtauth.SetIssuedNow(claims)
	jwtauth.SetExpiryIn(claims, time.Hour*24*7)
	_, tokenString, err := tokenAuth.Encode(claims)
	return tokenString, err
}

func Verifier() func(http.Handler) http.Handler {
	return jwtauth.Verifier(tokenAuth)
}

func Authenticator() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, _, err := jwtauth.FromContext(r.Context())

			if err == nil {
				if token == nil || jwt.Validate(token, tokenAuth.ValidateOptions()...) != nil {
					http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
					return
				}

				userID, ok := token.Get("user_id")

				if !ok {
					http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
					return
				}

				next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userIDContextKey{}, uint(userID.(float64)))))
			} else {
				next.ServeHTTP(w, r)
			}
		})
	}
}

func GetUserID(r *http.Request) (uint, bool) {
	userID, ok := r.Context().Value(userIDContextKey{}).(uint)
	return userID, ok
}

func CheckUserID(r *http.Request, targetUserID uint) bool {
	userID, ok := GetUserID(r)

	if ok && userID == targetUserID {
		return true
	}

	user, err := db.GetUser(int64(userID))

	return err == nil && user.Role == "admin"
}

func SignInUser(w http.ResponseWriter, userID uint) (err error) {
	token, err := Sign(userID)

	if err != nil {
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    token,
		Secure:   true,
		HttpOnly: true,
		MaxAge:   60 * 60 * 24 * 7,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	return
}

func SignOutUser(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    "",
		Secure:   true,
		HttpOnly: true,
		MaxAge:   -1,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})
}
