package routes

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/stephenafamo/bob"
	"github.com/stephenafamo/bob/dialect/mysql"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
)

func handleGetTag(w http.ResponseWriter, r *http.Request) {
	tagID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	tag, err := db.GetTag(tagID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tag)
}

func handleGetTags(w http.ResponseWriter, r *http.Request) {
	var filter []bob.Expression

	if r.URL.Query().Get("query") != "" {
		filter = append(filter, mysql.Quote("t", "name").Like(mysql.Arg("%"+r.URL.Query().Get("query")+"%")))
	}

	tags, err := db.GetTags(5, 0, filter)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tags)
}

func handleUpdateTag(w http.ResponseWriter, r *http.Request) {
	tagID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	tag, err := db.GetTag(tagID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if !auth.CheckUserID(r, 0) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	tag.Color = r.FormValue("color")
	tag.Description = r.FormValue("description")

	err = db.UpdateTag(tagID, tag.Color, tag.Description)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tag)
}

func handleGetTrendingTags(w http.ResponseWriter, r *http.Request) {
	tags, err := db.GetTags(10, 0, []bob.Expression{mysql.Quote("p", "created_at").GTE(mysql.F("DATE_SUB", mysql.F("NOW"), "INTERVAL 1 MONTH"))})

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tags)
}

func TagsRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/{id:\\d+}", handleGetTag)
		r.Get("/", handleGetTags)
		r.Patch("/{id:\\d+}", handleUpdateTag)
		r.Get("/trending", handleGetTrendingTags)
	}
}
