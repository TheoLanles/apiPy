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

// DownloadLogsHandler streams logs as a text file directly from DB (constant memory)
func DownloadLogsHandler(c *gin.Context) {
	scriptID := c.Param("id")

	rows, err := database.DB.Model(&models.ScriptLog{}).
		Where("script_id = ?", scriptID).
		Order("created_at ASC").
		Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch logs"})
		return
	}
	defer rows.Close()

	c.Header("Content-Disposition", "attachment; filename=logs.txt")
	c.Header("Content-Type", "text/plain")
	c.Status(http.StatusOK)

	for rows.Next() {
		var log models.ScriptLog
		if err := database.DB.ScanRows(rows, &log); err != nil {
			continue
		}
		fmt.Fprintf(c.Writer, "[%s] %s: %s\n", log.CreatedAt.Format("2006-01-02 15:04:05"), log.Level, log.Line)
	}
}
