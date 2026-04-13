package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

type UpdateSettingsRequest struct {
	DiscordWebhookURL string `json:"discord_webhook_url"`
}

// GetSettingsHandler returns the current system settings
func GetSettingsHandler(c *gin.Context) {
	var settings models.Settings
	// Attempt to find the first settings record, or create a default one
	if err := database.DB.First(&settings).Error; err != nil {
		settings = models.Settings{ID: 1, DiscordWebhookURL: ""}
		database.DB.Create(&settings)
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettingsHandler updates system settings (Admin only)
func UpdateSettingsHandler(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var settings models.Settings
	if err := database.DB.First(&settings).Error; err != nil {
		settings = models.Settings{ID: 1}
	}

	settings.DiscordWebhookURL = req.DiscordWebhookURL

	if err := database.DB.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
		return
	}

	c.JSON(http.StatusOK, settings)
}
