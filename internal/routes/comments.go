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
	"github.com/themintchoco/cvwo/internal/utils"
)

func handleGetPostComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	comment, err := db.GetPostComment(commentID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func handleGetPostComments(w http.ResponseWriter, r *http.Request) {
	page, err := strconv.ParseInt(r.URL.Query().Get("page"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	filters := []bob.Expression{mysql.Quote("c", "deleted_at").IsNull()}
	sortBy := mysql.Quote("c", "created_at")

	if r.URL.Query().Get("post") != "" {
		postID, err := strconv.ParseInt(r.URL.Query().Get("post"), 10, 64)

		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		filters = append(filters, mysql.Quote("c", "post_id").EQ(mysql.Arg(postID)))
	}

	if r.URL.Query().Get("user") != "" {
		filters = append(filters, mysql.Quote("u", "username").EQ(mysql.Arg(r.URL.Query().Get("user"))))
	}

	comments, err := db.GetPostComments(10, 10*(page-1), filters, sortBy)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comments)
}

func handleCreatePostComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	postID, err := strconv.ParseInt(r.URL.Query().Get("post"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	commentID, err := db.CreatePostComment(int64(userID), postID, utils.Sanitize(r.FormValue("body")))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	comment, err := db.GetPostComment(commentID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func handleUpdatePostComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	comment, err := db.GetPostComment(commentID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if comment.Deleted {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	if !auth.CheckUserID(r, comment.Author.ID) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	comment.Body = utils.Sanitize(r.FormValue("body"))

	err = db.UpdatePostComment(commentID, comment.Body)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func handleDeletePostComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	comment, err := db.GetPostComment(commentID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if comment.Deleted {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	if !auth.CheckUserID(r, comment.Author.ID) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	err = db.DeletePostComment(commentID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func CommentsRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/{id:\\d+}", handleGetPostComment)
		r.Get("/", handleGetPostComments)
		r.Post("/", handleCreatePostComment)
		r.Patch("/{id:\\d+}", handleUpdatePostComment)
		r.Delete("/{id:\\d+}", handleDeletePostComment)
	}
}
