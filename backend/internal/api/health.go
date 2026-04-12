package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// HealthHandler returns health status
func HealthHandler(c *gin.Context) {
	// Check if setup is needed
	var count int64
	setupNeeded := false
	if err := database.DB.Model(&models.User{}).Count(&count).Error; err == nil {
		setupNeeded = count == 0
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "ok",
		"message":      "PyRunner API is running",
		"version":      "v1.2.6",
		"setup_needed": setupNeeded,
	})
}
