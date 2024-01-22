package routes

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/stephenafamo/bob"
	"github.com/stephenafamo/bob/dialect/mysql"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
	"github.com/themintchoco/cvwo/internal/utils"
)

func handleGetPost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	post, err := db.GetPost(postID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func handleGetPosts(w http.ResponseWriter, r *http.Request) {
	page, err := strconv.ParseInt(r.URL.Query().Get("page"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	filters := []bob.Expression{mysql.Quote("p", "deleted_at").IsNull()}
	var sortBy any = mysql.Quote("p", "created_at")

	if r.URL.Query().Get("user") != "" {
		filters = append(filters, mysql.Quote("u", "username").EQ(mysql.Arg(r.URL.Query().Get("user"))))
	}

	if r.URL.Query().Get("tag") != "" {
		filters = append(filters, mysql.Quote("t", "id").EQ(mysql.Arg(r.URL.Query().Get("tag"))))
	}

	if r.URL.Query().Get("query") != "" {
		filters = append(filters, mysql.Or(
			mysql.Quote("p", "title").Like(mysql.Arg("%"+r.URL.Query().Get("query")+"%")),
			mysql.Quote("p", "body").Like(mysql.Arg("%"+r.URL.Query().Get("query")+"%")),
		))
	}

	if r.URL.Query().Get("sort") == "popular" {
		sortBy = mysql.F("COUNT", mysql.Quote("pr", "reaction_id"))
	}

	if r.URL.Query().Get("sort") == "replies" {
		sortBy = mysql.F("COUNT", "DISTINCT c.id")
	}

	posts, err := db.GetPosts(10, 10*(page-1), filters, sortBy)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(posts)
}

func handleCreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	if len(r.FormValue("title")) == 0 {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	postID, err := db.CreatePost(int64(userID), r.FormValue("title"), utils.Sanitize(r.FormValue("body")))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	re, err := regexp.Compile("^[a-z-]+$")

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	tags := strings.SplitN(r.FormValue("tags"), ",", 4)
	tags = tags[:min(len(tags), 3)]

	for _, tag := range tags {
		tag = strings.TrimSpace(tag)

		if len(tag) == 0 || len(tag) > 32 {
			continue
		}

		match := re.MatchString(tag)

		if !match {
			continue
		}

		db.CreateTag(tag, "gray", "")
		db.CreatePostTag(postID, tag)
	}

	post, err := db.GetPost(postID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func handleUpdatePost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	post, err := db.GetPost(postID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if post.Deleted {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	if !auth.CheckUserID(r, post.Author.ID) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	post.Body = utils.Sanitize(r.FormValue("body"))

	err = db.UpdatePost(postID, post.Title, post.Body)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func handleDeletePost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	post, err := db.GetPost(postID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if post.Deleted {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	if !auth.CheckUserID(r, post.Author.ID) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	err = db.DeletePost(postID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func PostsRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/{id:\\d+}", handleGetPost)
		r.Get("/", handleGetPosts)
		r.Post("/", handleCreatePost)
		r.Patch("/{id:\\d+}", handleUpdatePost)
		r.Delete("/{id:\\d+}", handleDeletePost)
	}
}
