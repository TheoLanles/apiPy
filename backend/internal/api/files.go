package api

import (
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

// InitScriptsDir initializes the scripts directory
func InitScriptsDir() error {
	scriptDir := "scripts"
	if _, err := os.Stat(scriptDir); os.IsNotExist(err) {
		return os.MkdirAll(scriptDir, 0755)
	}
	return nil
}

// UploadScriptHandler handles Python script file uploads
func UploadScriptHandler(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Get form data
	name := c.PostForm("name")
	description := c.PostForm("description")

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	// Get uploaded file (.py)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	if filepath.Ext(file.Filename) != ".py" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .py files are allowed"})
		return
	}

	// Get optional requirements file (.txt)
	reqFile, _ := c.FormFile("requirements")

	// Create script directory
	scriptID := uuid.New().String()
	scriptDir := filepath.Join("scripts", scriptID)
	if err := os.MkdirAll(scriptDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create script directory"})
		return
	}

	// Save main script file
	filePath := filepath.Join(scriptDir, file.Filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		os.RemoveAll(scriptDir)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save script file"})
		return
	}

	// Save requirements file if provided
	reqPath := ""
	if reqFile != nil {
		reqPath = filepath.Join(scriptDir, "requirements.txt")
		if err := c.SaveUploadedFile(reqFile, reqPath); err != nil {
			// Don't fail the whole upload, just log and continue? 
			// No, better to be clean.
			os.RemoveAll(scriptDir)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save requirements file"})
			return
		}
	}

	// Create script record
	script := models.Script{
		ID:          scriptID,
		Name:        name,
		Path:        filePath,
		Description: description,
		StartOnBoot: false,
		AutoRestart: false,
		CreatedBy:   userID.(string),
	}

	if err := database.DB.Create(&script).Error; err != nil {
		os.RemoveAll(scriptDir)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create script record"})
		return
	}

	// Initialize status
	processState := models.ProcessState{
		ID:       uuid.New().String(),
		ScriptID: script.ID,
		Status:   "stopped",
	}
	database.DB.Create(&processState)

	// Trigger background installation if requirements exist
	if reqPath != "" {
		go installDependencies(script.ID, reqPath)
	}

	c.JSON(http.StatusCreated, script)
}

func installDependencies(scriptID, reqPath string) {
	scriptDir := filepath.Dir(reqPath)
	venvDir := filepath.Join(scriptDir, "venv")
	
	SaveLog(scriptID, "Creating virtual environment (venv)...", "INFO")
	
	// Create venv
	createVenvCmd := exec.Command(getSystemPython(), "-m", "venv", "venv")
	createVenvCmd.Dir = scriptDir
	if output, err := createVenvCmd.CombinedOutput(); err != nil {
		SaveLog(scriptID, "Failed to create virtual environment: " + string(output) + " (" + err.Error() + ")", "ERROR")
		return
	}
	
	SaveLog(scriptID, "Virtual environment created successfully.", "INFO")
	SaveLog(scriptID, "Installing dependencies from requirements.txt...", "INFO")
	
	// Detect pip path (Windows vs Unix vs MSYS2)
	candidates := []string{
		filepath.Join(venvDir, "Scripts", "python.exe"),
		filepath.Join(venvDir, "bin", "python"),
		filepath.Join(venvDir, "bin", "python.exe"),
	}
	
	var pipPython string
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			absPath, err := filepath.Abs(c)
			if err == nil {
				pipPython = absPath
			} else {
				pipPython = c
			}
			break
		}
	}

	if pipPython == "" {
		SaveLog(scriptID, "Failed to find Python executable in venv. Looked in: Scripts/python.exe, bin/python", "ERROR")
		return
	}

	installCmd := exec.Command(pipPython, "-m", "pip", "install", "-r", "requirements.txt")
	installCmd.Dir = scriptDir
	output, err := installCmd.CombinedOutput()
	
	if err != nil {
		errorMessage := string(output)
		if errorMessage == "" {
			errorMessage = err.Error()
		}
		SaveLog(scriptID, "Failed to install dependencies: " + errorMessage, "ERROR")
	} else {
		SaveLog(scriptID, "Dependencies installed successfully:\n" + string(output), "INFO")
	}
}

// GetScriptFileHandler returns the content of a script file
func GetScriptFileHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Read file content (validate path in case of tampered DB entries)
	if _, ok := validateScriptPath(script.Path); !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "script path is outside allowed directory"})
		return
	}

	content, err := os.ReadFile(script.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read script file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      script.ID,
		"name":    script.Name,
		"path":    script.Path,
		"content": string(content),
	})
}

// UpdateScriptFileHandler updates the content of a script file
func UpdateScriptFileHandler(c *gin.Context) {
	scriptID := c.Param("id")

	type UpdateFileRequest struct {
		Content string `json:"content" binding:"required"`
	}

	var req UpdateFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Validate path before writing (defense-in-depth)
	if _, ok := validateScriptPath(script.Path); !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "script path is outside allowed directory"})
		return
	}

	// Write updated content to file
	if err := os.WriteFile(script.Path, []byte(req.Content), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update script file"})
		return
	}

	// Update the updated_at timestamp
	script.UpdatedAt = time.Now()
	if err := database.DB.Save(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update script record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "script file updated successfully"})
}

// DeleteScriptFileHandler deletes a script and its directory
func DeleteScriptFileHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Delete the script directory and all its contents
	scriptDir := filepath.Join("scripts", scriptID)
	if err := os.RemoveAll(scriptDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete script directory"})
		return
	}

	// Delete from database
	if err := database.DB.Delete(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete script from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "script deleted successfully"})
}

// ReinstallDependenciesHandler triggers a manual dependency installation
func ReinstallDependenciesHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	dir := filepath.Dir(script.Path)
	reqPath := filepath.Join(dir, "requirements.txt")

	if _, err := os.Stat(reqPath); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requirements.txt not found for this script"})
		return
	}

	// Trigger background installation
	go installDependencies(scriptID, reqPath)

	c.JSON(http.StatusOK, gin.H{"message": "reinstallation started in the background"})
}
