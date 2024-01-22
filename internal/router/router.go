package router

import (
	"net/http"
	"net/http/httputil"
	"os"
	"path"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/themintchoco/cvwo/internal/routes"
)

func Setup() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	if os.Getenv("ENV") == "prod" {
		r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(path.Base(r.URL.Path), ".") {
				http.ServeFile(w, r, path.Join("./web/dist", r.URL.Path))
				return
			}

			http.ServeFile(w, r, "./web/dist")
		}))
	} else {
		r.Handle("/*", &httputil.ReverseProxy{
			Director: func(r *http.Request) {
				r.URL.Scheme = "http"
				r.URL.Host = "localhost:5173"
			},
		})
	}

	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(os.Getenv("UPLOADS_DIR")))))

	r.Route("/api", routes.APIRoutes())

	return r
}
