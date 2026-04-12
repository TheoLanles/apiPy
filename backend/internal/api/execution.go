package api

import (
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// Global map to track running processes
var runningProcesses = make(map[string]*exec.Cmd)
var manualStops sync.Map // Track scripts intended to stop

// StartScriptHandler starts a script
func StartScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Check if already running
	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch process state"})
		return
	}

	if state.Status == "running" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "script is already running"})
		return
	}

	// Detect venv python
	pythonPath := "python"
	scriptDir := filepath.Dir(script.Path)
	venvPython := filepath.Join(scriptDir, "venv", "Scripts", "python.exe")
	if _, err := os.Stat(venvPython); os.IsNotExist(err) {
		venvPython = filepath.Join(scriptDir, "venv", "bin", "python")
	}

	if _, err := os.Stat(venvPython); err == nil {
		absPath, err := filepath.Abs(venvPython)
		if err == nil {
			pythonPath = absPath
		} else {
			pythonPath = venvPython
		}
	}

	// Start process
	cmd := exec.Command(pythonPath, script.Path)
	cmd.SysProcAttr = ConfigureSysProcAttr()

	// Create pipes for stdout/stderr
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start script"})
		return
	}

	// Store process
	runningProcesses[scriptID] = cmd

	// Update process state
	now := time.Now()
	state.PID = cmd.Process.Pid
	state.Status = "running"
	state.StartedAt = &now
	state.StoppedAt = nil
	database.DB.Save(&state)

	// Stream logs (non-blocking)
	go streamLogs(scriptID, script.ID, stdout, stderr, cmd)

	c.JSON(http.StatusOK, gin.H{
		"message": "script started",
		"pid":     cmd.Process.Pid,
	})
}

// StopScriptHandler stops a script
func StopScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch process state"})
		return
	}

	if state.Status != "running" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "script is not running"})
		return
	}

	// Mark as manual stop
	manualStops.Store(scriptID, true)

	// Kill the process using OS-specific helper
	KillProcessTree(state.PID)

	c.JSON(http.StatusOK, gin.H{"message": "stop command sent"})
}

// RestartScriptHandler restarts a script
func RestartScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch process state"})
		return
	}

	// Stop if running
	if state.Status == "running" {
		if cmd, exists := runningProcesses[scriptID]; exists {
			cmd.Process.Kill()
			delete(runningProcesses, scriptID)
		}
	}

	// Small delay
	time.Sleep(500 * time.Millisecond)

	// Re-trigger the start handler by creating a context and calling it
	newCtx := &gin.Context{}
	*newCtx = *c
	newCtx.Params = append(newCtx.Params, gin.Param{Key: "id", Value: scriptID})
	StartScriptHandler(newCtx)
}

// GetScriptStatusHandler returns the script status
func GetScriptStatusHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "process state not found"})
		return
	}

	c.JSON(http.StatusOK, state)
}

// streamLogs continuously reads and stores logs from stdout/stderr
func streamLogs(scriptID string, dbScriptID string, stdout, stderr io.ReadCloser, cmd *exec.Cmd) {
	defer stdout.Close()
	defer stderr.Close()

	// Channel to track completion
	done := make(chan error, 2)

	// Read stdout
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stdout.Read(buf)
			if n > 0 {
				line := string(buf[:n])
				SaveLog(dbScriptID, line, "INFO")
			}
			if err != nil {
				done <- err
				return
			}
		}
	}()

	// Read stderr
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stderr.Read(buf)
			if n > 0 {
				line := string(buf[:n])
				SaveLog(dbScriptID, line, "ERROR")
			}
			if err != nil {
				done <- err
				return
			}
		}
	}()

	// Wait for process to finish
	execErr := cmd.Wait()

	// Check if this was a manual stop
	_, isManual := manualStops.Load(scriptID)
	if isManual {
		manualStops.Delete(scriptID)
	}

	// Fetch script name for notification
	var script models.Script
	database.DB.First(&script, "id = ?", dbScriptID)

	// Update status
	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err == nil {
		now := time.Now()
		if execErr != nil {
			if isManual {
				state.Status = "stopped"
			} else {
				state.Status = "error"
				// Send Discord alert for crash
				go SendDiscordNotification(script.Name, "Crashed", true)
			}
		} else {
			state.Status = "stopped"
			// Optional: Send info notification for clean exit
			// go SendDiscordNotification(script.Name, "Finished", false)
		}
		state.StoppedAt = &now
		database.DB.Save(&state)
	}

	delete(runningProcesses, scriptID)
}

// SaveLog stores a log entry in the database
func SaveLog(scriptID, content, level string) {
	log := models.ScriptLog{
		ID:       uuid.New().String(),
		ScriptID: scriptID,
		Line:     content,
		Level:    level,
	}
	database.DB.Create(&log)
}
