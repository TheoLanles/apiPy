package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/middleware"
	"github.com/theo/pyrunner/internal/models"
)

type UpdateSettingsRequest struct {
	DiscordWebhookURL string `json:"discord_webhook_url"`
	CORSDomain        string `json:"cors_domain"`
	OIDCEnabled       bool   `json:"oidc_enabled"`
	OIDCIssuer        string `json:"oidc_issuer"`
	OIDCClientID      string `json:"oidc_client_id"`
	OIDCClientSecret  string `json:"oidc_client_secret"`
	OIDCRedirectURL   string `json:"oidc_redirect_url"`
}

// maskSecret returns a masked version of a secret string
func maskSecret(s string) string {
	if s == "" {
		return ""
	}
	return "••••••••"
}

// GetSettingsHandler returns the current system settings
// Admins see full secrets, non-admins see masked values
func GetSettingsHandler(c *gin.Context) {
	var settings models.Settings
	// Attempt to find the first settings record, or create a default one
	if err := database.DB.First(&settings).Error; err != nil {
		settings = models.Settings{ID: 1, DiscordWebhookURL: ""}
		database.DB.Create(&settings)
	}

	// Check if the requesting user is an admin
	role, _ := c.Get("user_role")
	if role != "admin" {
		// Non-admin: mask sensitive fields
		c.JSON(http.StatusOK, gin.H{
			"id":                 settings.ID,
			"discord_webhook_url": maskSecret(settings.DiscordWebhookURL),
			"cors_domain":        settings.CORSDomain,
			"oidc_enabled":       settings.OIDCEnabled,
			"oidc_issuer":        settings.OIDCIssuer,
			"oidc_client_id":     settings.OIDCClientID,
			"oidc_client_secret": maskSecret(settings.OIDCClientSecret),
			"oidc_redirect_url":  settings.OIDCRedirectURL,
		})
		return
	}

	// Admin: full access
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
	settings.CORSDomain = req.CORSDomain
	settings.OIDCEnabled = req.OIDCEnabled
	settings.OIDCIssuer = req.OIDCIssuer
	settings.OIDCClientID = req.OIDCClientID
	settings.OIDCClientSecret = req.OIDCClientSecret
	settings.OIDCRedirectURL = req.OIDCRedirectURL

	if err := database.DB.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
		return
	}

	// Hot-reload the CORS origin without restarting
	middleware.SetCORSDomain(settings.CORSDomain)

	c.JSON(http.StatusOK, settings)
}

