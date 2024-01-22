package routes

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/themintchoco/cvwo/internal/api"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
)

func handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	prefs, err := db.GetUserPreferences(int64(userID))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(api.Me{
		ID:    userID,
		Prefs: prefs,
	})
}

func handleUpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	var err error

	switch chi.URLParam(r, "key") {
	case "prefersDarkMode":
		err = db.UpdateUserPreferences(int64(userID), "prefersDarkMode", r.FormValue("value") == "true")
	case "prefersReducedMotion":
		err = db.UpdateUserPreferences(int64(userID), "prefersReducedMotion", r.FormValue("value") == "true")
	case "preferredSort":
		err = db.UpdateUserPreferences(int64(userID), "preferredSort", r.FormValue("value"))
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func MeRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", handleMe)
		r.Patch("/{key:\\w+}", handleUpdateMe)
	}
}
