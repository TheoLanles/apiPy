package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type KillPortRequest struct {
	Port int `json:"port" binding:"required"`
}

// KillPortHandler handles manual process termination by port
func KillPortHandler(c *gin.Context) {
	var req KillPortRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "port is required"})
		return
	}

	if err := KillProcessByPort(req.Port); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "process on port killed successfully"})
}
