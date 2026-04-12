package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BulkActionRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

// BulkStartHandler starts multiple scripts
func BulkStartHandler(c *gin.Context) {
	var req BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids are required"})
		return
	}

	results := make(map[string]string)
	for _, id := range req.IDs {
		if err := StartScriptInternal(id); err != nil {
			results[id] = fmt.Sprintf("Error: %v", err)
		} else {
			results[id] = "Started"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk start processed",
		"results": results,
	})
}

// BulkStopHandler stops multiple scripts
func BulkStopHandler(c *gin.Context) {
	var req BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids are required"})
		return
	}

	results := make(map[string]string)
	for _, id := range req.IDs {
		if err := StopScriptInternal(id); err != nil {
			results[id] = fmt.Sprintf("Error: %v", err)
		} else {
			results[id] = "Stopped"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk stop processed",
		"results": results,
	})
}
