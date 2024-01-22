package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/h2non/bimg"
	"github.com/themintchoco/cvwo/internal/auth"
	"github.com/themintchoco/cvwo/internal/db"
)

func handleGetUser(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	user, err := db.GetUser(userID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	ok := auth.CheckUserID(r, uint(userID))

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	var password *string
	var bio *string

	if r.FormValue("password") != "" {
		newPassword := r.FormValue("password")
		password = &newPassword
	}

	if r.FormValue("bio") != "" {
		newBio := r.FormValue("bio")
		bio = &newBio
	}

	err = db.UpdateUser(userID, nil, password, nil, bio)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	user, err := db.GetUser(userID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func handleUpdateUserAvatar(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	ok := auth.CheckUserID(r, uint(userID))

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	user, err := db.GetUser(userID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	maxSize, err := strconv.ParseInt(os.Getenv("MAX_UPLOAD_SIZE"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxSize)
	err = r.ParseMultipartForm(maxSize)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	f, _, err := r.FormFile("file")

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	defer f.Close()

	var buf bytes.Buffer
	_, err = io.Copy(&buf, f)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	ftype := http.DetectContentType(buf.Bytes())

	if ftype != "image/jpeg" && ftype != "image/png" {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	image := bimg.NewImage(buf.Bytes())
	thumb, err := image.Thumbnail(256)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("%s.%s", uuid.NewString(), bimg.DetermineImageTypeName(thumb))
	filepath := fmt.Sprintf("%s/%s", os.Getenv("UPLOADS_DIR"), filename)
	avatar := fmt.Sprintf("/uploads/%s", filename)

	fout, err := os.Create(filepath)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	defer fout.Close()

	_, err = fout.Write(thumb)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if user.Avatar != nil {
		err = os.Remove(fmt.Sprintf("%s/%s", os.Getenv("UPLOADS_DIR"), (*user.Avatar)[9:]))

		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}

	user.Avatar = &avatar
	err = db.UpdateUserAvatar(int64(userID), user.Avatar)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func handleDeleteUserAvatar(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	ok := auth.CheckUserID(r, uint(userID))

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	user, err := db.GetUser(userID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if user.Avatar == nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	err = os.Remove(fmt.Sprintf("%s/%s", os.Getenv("UPLOADS_DIR"), (*user.Avatar)[9:]))

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	user.Avatar = nil
	err = db.UpdateUserAvatar(int64(userID), nil)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	ok := auth.CheckUserID(r, uint(userID))

	if !ok {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	user, err := db.GetUser(userID)

	if err == db.ErrNotFound {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if user.Deleted {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	err = db.DeleteUser(userID)

	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	auth.SignOutUser(w)

	json.NewEncoder(w).Encode(user)
}

func UsersRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/{id:\\d+}", handleGetUser)
		r.Post("/{id:\\d+}", handleUpdateUser)
		r.Post("/{id:\\d+}/avatar", handleUpdateUserAvatar)
		r.Delete("/{id:\\d+}/avatar", handleDeleteUserAvatar)
		r.Delete("/{id:\\d+}", handleDeleteUser)
	}
}
