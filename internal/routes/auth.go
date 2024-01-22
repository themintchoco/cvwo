package routes

import (
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/go-chi/chi/v5"
	"github.com/themintchoco/cvwo/internal/api"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
)

func handleLogin(w http.ResponseWriter, r *http.Request) {
	userID, err := db.AuthenticateUser(r.FormValue("username"), r.FormValue("password"))

	if err == db.ErrPasswordMismatch {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	user, err := db.GetUser(userID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	err = auth.SignInUser(w, user.ID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(api.Me{ID: user.ID})
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if len(r.FormValue("username")) < 3 || len(r.FormValue("username")) > 32 || len(r.FormValue("password")) < 8 {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	match, err := regexp.MatchString("^[a-zA-Z0-9_]+$", r.FormValue("username"))

	if err != nil || !match {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	userID, err := db.CreateUser(r.FormValue("username"), r.FormValue("password"), "member")

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	err = auth.SignInUser(w, uint(userID))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(api.Me{ID: uint(userID)})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	auth.SignOutUser(w)

	w.WriteHeader(http.StatusNoContent)
}

func handleCheckUsername(w http.ResponseWriter, r *http.Request) {
	available, err := db.GetUsernameAvailability(r.URL.Query().Get("username"))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"available": available})
}

func AuthRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Post("/login", handleLogin)
		r.Post("/register", handleRegister)
		r.Post("/logout", handleLogout)
		r.Get("/checkUsername", handleCheckUsername)
	}
}
