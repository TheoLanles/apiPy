package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

type KillPortRequest struct {
	Port int `json:"port" binding:"required"`
}

// isManagedPID checks if a PID belongs to a script managed by PyRunner
func isManagedPID(pid int) bool {
	if pid <= 0 {
		return false
	}

	// Check in-memory running processes
	processMutex.RLock()
	for _, cmd := range runningProcesses {
		if cmd.Process != nil && cmd.Process.Pid == pid {
			processMutex.RUnlock()
			return true
		}
	}
	processMutex.RUnlock()

	// Check database (process may have been started in a previous session)
	var count int64
	database.DB.Model(&models.ProcessState{}).Where("pid = ? AND status = ?", pid, "running").Count(&count)
	return count > 0
}

// KillPortHandler handles manual process termination by port
// Only allows killing processes that belong to PyRunner-managed scripts
func KillPortHandler(c *gin.Context) {
	var req KillPortRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "port is required"})
		return
	}

	if req.Port <= 0 || req.Port > 65535 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid port number (1-65535)"})
		return
	}

	if req.Port == 8080 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Security: Cannot kill the main application port (8080)"})
		return
	}

	// Find the PID on this port first, then verify it's managed by PyRunner
	pid, err := FindPIDByPort(req.Port)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if !isManagedPID(pid) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": fmt.Sprintf("Security: PID %d on port %d is not managed by PyRunner. Only PyRunner script processes can be killed.", pid, req.Port),
		})
		return
	}

	// Safe to kill — it's a PyRunner process
	if err := KillProcessTree(pid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to kill process: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("PyRunner process (PID %d) on port %d killed successfully", pid, req.Port),
	})
}

// parsePID safely converts a string to an int PID
func parsePID(s string) (int, error) {
	pid, err := strconv.Atoi(s)
	if err != nil || pid <= 0 {
		return 0, fmt.Errorf("invalid PID: %s", s)
	}
	return pid, nil
}
