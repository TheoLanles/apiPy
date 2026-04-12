package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// GetLogsHandler returns logs for a script
func GetLogsHandler(c *gin.Context) {
	scriptID := c.Param("id")
	limitStr := c.DefaultQuery("limit", "1000")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 1000
	}

	logs := []models.ScriptLog{}
	if err := database.DB.
		Where("script_id = ?", scriptID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// DeleteLogsHandler clears logs for a script
func DeleteLogsHandler(c *gin.Context) {
	scriptID := c.Param("id")

	if err := database.DB.Delete(&models.ScriptLog{}, "script_id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logs deleted"})
}

// DownloadLogsHandler returns logs as text file
func DownloadLogsHandler(c *gin.Context) {
	scriptID := c.Param("id")

	logs := []models.ScriptLog{}
	if err := database.DB.
		Where("script_id = ?", scriptID).
		Order("created_at ASC").
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch logs"})
		return
	}

	var content string
	for _, log := range logs {
		content += fmt.Sprintf("[%s] %s: %s\n", log.CreatedAt.Format("2006-01-02 15:04:05"), log.Level, log.Line)
	}

	c.Header("Content-Disposition", "attachment; filename=logs.txt")
	c.Data(http.StatusOK, "text/plain", []byte(content))
}
