package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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
