package routes

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
)

func handleGetPostReaction(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(chi.URLParam(r, "postID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reaction, err := db.GetPostReaction(userID, postID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reaction)
}

func handleGetPostReactions(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(chi.URLParam(r, "postID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reactions, err := db.GetPostReactions(postID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reactions)
}

func handleSetPostReaction(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	postID, err := strconv.ParseInt(chi.URLParam(r, "postID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reaction := r.FormValue("reaction")

	if reaction == "" {
		err = db.DeletePostReaction(int64(userID), postID)
	} else {
		err = db.CreatePostReaction(int64(userID), postID, reaction)
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func handleGetCommentReaction(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "commentID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reaction, err := db.GetCommentReaction(userID, commentID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reaction)
}

func handleGetCommentReactions(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "commentID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reactions, err := db.GetCommentReactions(commentID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reactions)
}

func handleSetCommentReaction(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	commentID, err := strconv.ParseInt(chi.URLParam(r, "commentID"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	reaction := r.FormValue("reaction")

	if reaction == "" {
		err = db.DeleteCommentReaction(int64(userID), commentID)
	} else {
		err = db.CreateCommentReaction(int64(userID), commentID, reaction)
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func ReactionsRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/post/{postID:\\d+}/{userID:\\d+}", handleGetPostReaction)
		r.Get("/post/{postID:\\d+}", handleGetPostReactions)
		r.Post("/post/{postID:\\d+}", handleSetPostReaction)
		r.Get("/comment/{commentID:\\d+}/{userID:\\d+}", handleGetCommentReaction)
		r.Get("/comment/{commentID:\\d+}", handleGetCommentReactions)
		r.Post("/comment/{commentID:\\d+}", handleSetCommentReaction)
	}
}
