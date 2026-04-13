package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// Global state for process tracking
var (
	runningProcesses = make(map[string]*exec.Cmd)
	processMutex     sync.RWMutex
	manualStops      sync.Map // Track scripts intended to stop
)

// StartScriptHandler starts a script
func StartScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")
	if err := StartScriptInternal(scriptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "script started"})
}

// StartScriptInternal contains the core logic to start a script without gin context
func StartScriptInternal(scriptID string) error {
	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		return fmt.Errorf("script not found")
	}

	// Check if already running
	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		return fmt.Errorf("failed to fetch process state")
	}

	if state.Status == "running" {
		return fmt.Errorf("script is already running")
	}

	// Detect venv python
	pythonPath := getSystemPython()
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
	
	// Force UTF-8 encoding and disable buffering for real-time logs
	cmd.Env = append(os.Environ(), 
		"PYTHONIOENCODING=utf-8",
		"PYTHONUNBUFFERED=1",
	)

	// Create pipes for stdout/stderr
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start process: %v", err)
	}

	// Store process safely
	processMutex.Lock()
	runningProcesses[scriptID] = cmd
	processMutex.Unlock()

	// Update process state
	now := time.Now()
	state.PID = cmd.Process.Pid
	state.Status = "running"
	state.StartedAt = &now
	state.StoppedAt = nil
	database.DB.Save(&state)

	// Stream logs (non-blocking)
	go streamLogs(scriptID, script.ID, stdout, stderr, cmd)

	return nil
}

// StopScriptHandler stops a script
func StopScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")
	if err := StopScriptInternal(scriptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "stop command sent"})
}

// StopScriptInternal contains the core logic to stop a script without gin context
func StopScriptInternal(scriptID string) error {
	var state models.ProcessState
	if err := database.DB.First(&state, "script_id = ?", scriptID).Error; err != nil {
		return fmt.Errorf("failed to fetch process state")
	}

	if state.Status != "running" {
		return nil
	}

	// Mark as manual stop so streamLogs knows this isn't a "crash"
	manualStops.Store(scriptID, true)

	// Kill the process using OS-specific helper
	err := KillProcessTree(state.PID)
	
	// Ensure status update if the process was already dead and missed by streamLogs
	processMutex.RLock()
	_, exists := runningProcesses[scriptID]
	processMutex.RUnlock()

	if !exists {
		now := time.Now()
		state.Status = "stopped"
		state.StoppedAt = &now
		database.DB.Save(&state)
		manualStops.Delete(scriptID)
	}

	return err
}

// RestartScriptHandler restarts a script
func RestartScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	// Stop using the internal logic to ensure it's marked as manual
	_ = StopScriptInternal(scriptID)

	processMutex.Lock()
	delete(runningProcesses, scriptID)
	processMutex.Unlock()

	// Small delay to allow process to release handles
	time.Sleep(800 * time.Millisecond)

	// Re-trigger the start logic
	if err := StartScriptInternal(scriptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "script restarted"})
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

// GetAllScriptsStatusHandler returns status for all scripts in a single call
func GetAllScriptsStatusHandler(c *gin.Context) {
	var states []models.ProcessState
	if err := database.DB.Find(&states).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch process states"})
		return
	}

	// Map to script_id -> state for easier frontend processing
	result := make(map[string]models.ProcessState)
	for _, s := range states {
		result[s.ScriptID] = s
	}

	c.JSON(http.StatusOK, result)
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
				// Kill any remaining children in the process group
				KillProcessTree(state.PID)
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

	processMutex.Lock()
	delete(runningProcesses, scriptID)
	processMutex.Unlock()
}

// SaveLog redirects logs to the buffering service for efficiency
func SaveLog(scriptID, content, level string) {
	QueueLog(scriptID, content, level)
}
