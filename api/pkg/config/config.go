package config

import (
	"log"
	"github.com/joho/godotenv"
)

// for local
func LoadEnv() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
}