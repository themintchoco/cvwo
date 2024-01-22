package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/themintchoco/cvwo/internal/auth"
)

func APIRoutes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(auth.Verifier())
		r.Use(auth.Authenticator())

		r.Route("/auth", AuthRoutes())
		r.Route("/me", MeRoutes())
		r.Route("/users", UsersRoutes())
		r.Route("/posts", PostsRoutes())
		r.Route("/comments", CommentsRoutes())
		r.Route("/reactions", ReactionsRoutes())
		r.Route("/tags", TagsRoutes())
	}
}
