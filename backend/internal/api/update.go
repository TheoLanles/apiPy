package api

import (
	"fmt"
	"net/http"
	"os/exec"
	"runtime"

	"github.com/gin-gonic/gin"
)

// UpdateSystemHandler triggers the Linux update script
func UpdateSystemHandler(c *gin.Context) {
	if runtime.GOOS != "linux" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Self-update is only supported on Linux"})
		return
	}

	// Command to run the update script
	// We use a bash wrapper to run it in the background after a small delay
	// to allow the API response to be sent back to the user.
	updateCmd := "sleep 1 && curl -sSL https://raw.githubusercontent.com/TheoLanles/apiPy/main/install.sh | sudo bash"
	
	cmd := exec.Command("bash", "-c", updateCmd)
	
	// Start the command in the background
	if err := cmd.Start(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to start update: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update started. The system will restart shortly.",
	})
}
