package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// SendDiscordNotification sends a message to the configured Discord Webhook
func SendDiscordNotification(scriptName, status string, isCrash bool) {
	var settings models.Settings
	if err := database.DB.First(&settings).Error; err != nil {
		return // No settings configured
	}

	if settings.DiscordWebhookURL == "" {
		return
	}

	color := 0x22c55e // Green
	title := "✅ Script Status Update"
	if isCrash {
		color = 0xef4444 // Red
		title = "🚨 Script Crash Alert"
	}

	payload := map[string]interface{}{
		"embeds": []map[string]interface{}{
			{
				"title":       title,
				"description": fmt.Sprintf("Script **%s** has changed its status.", scriptName),
				"color":       color,
				"fields": []map[string]interface{}{
					{
						"name":   "Script Name",
						"value":  scriptName,
						"inline": true,
					},
					{
						"name":   "Status",
						"value":  status,
						"inline": true,
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
				"footer": map[string]string{
					"text": "ZACT PyRunner Notifications",
				},
			},
		},
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(settings.DiscordWebhookURL, "application/json", bytes.NewBuffer(jsonPayload))
	if err == nil {
		resp.Body.Close()
	}
}

// TestDiscordWebhookHandler sends a test notification to verify settings
func TestDiscordWebhookHandler(c *gin.Context) {
	var settings models.Settings
	if err := database.DB.First(&settings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no settings found"})
		return
	}

	if settings.DiscordWebhookURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "webhook URL is not configured"})
		return
	}

	// Re-use logic with a test message
	SendDiscordNotification("Test System", "TEST - Configuration working!", false)

	c.JSON(http.StatusOK, gin.H{"message": "Test notification sent successfully"})
}
