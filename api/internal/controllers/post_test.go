package controllers

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/mongo"
)

func mockDBSet() *mongo.Client {
	// Return a mock MongoDB client or nil for testing purposes
	return nil
}

func TestMain(m *testing.M) {
	// Set the TEST_ENV environment variable to true for testing
	if err := os.Setenv("TEST_ENV", "true"); err != nil {
		panic("Failed to set TEST_ENV: " + err.Error())
	}
	os.Exit(m.Run())
}

func TestContains(t *testing.T) {
	// Ensure MONGO_URI is set before any database initialization
	if err := os.Setenv("MONGO_URI", "mock_uri"); err != nil {
		t.Fatalf("Failed to set MONGO_URI: %v", err)
	}

	// Mock the database client
	client := mockDBSet()
	if client == nil {
		t.Log("Using mock database client")
	}

	// Test data
	slice := []string{"apple", "banana", "cherry"}

	// Test cases
	tests := []struct {
		name     string
		element  string
		expected bool
	}{
		{"Element exists", "banana", true},
		{"Element does not exist", "grape", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := contains(slice, tt.element)
			assert.Equal(t, tt.expected, result)
		})
	}
}
