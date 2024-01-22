package main

import (
	"log"
	"net/http"

	"github.com/themintchoco/cvwo/internal/db"
	"github.com/themintchoco/cvwo/internal/router"
)

func main() {
	log.Println("Starting server...")

	err := db.Connect()

	if err != nil {
		log.Fatalln(err)
	}

	r := router.Setup()
	log.Fatalln(http.ListenAndServe(":3000", r))
}
