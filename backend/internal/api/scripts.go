package api

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

type CreateScriptRequest struct {
	Name        string `json:"name" binding:"required"`
	Path        string `json:"path" binding:"required"`
	Description string `json:"description"`
	StartOnBoot bool   `json:"start_on_boot"`
	AutoRestart bool   `json:"auto_restart"`
}

type UpdateScriptRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	StartOnBoot bool   `json:"start_on_boot"`
	AutoRestart bool   `json:"auto_restart"`
}

type ScriptResponse struct {
	models.Script
	HasRequirements bool `json:"has_requirements"`
}

// GetScriptsHandler lists all scripts
func GetScriptsHandler(c *gin.Context) {
	var scripts []models.Script
	if err := database.DB.Find(&scripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch scripts"})
		return
	}

	response := []ScriptResponse{}
	for _, s := range scripts {
		dir := filepath.Dir(s.Path)
		reqPath := filepath.Join(dir, "requirements.txt")
		_, err := os.Stat(reqPath)
		response = append(response, ScriptResponse{
			Script:          s,
			HasRequirements: err == nil,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetScriptHandler returns a single script
func GetScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	dir := filepath.Dir(script.Path)
	reqPath := filepath.Join(dir, "requirements.txt")
	_, err := os.Stat(reqPath)

	c.JSON(http.StatusOK, ScriptResponse{
		Script:          script,
		HasRequirements: err == nil,
	})
}

// CreateScriptHandler creates a new script
func CreateScriptHandler(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify file exists
	if _, err := os.Stat(req.Path); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "script file not found"})
		return
	}

	script := models.Script{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Path:        req.Path,
		Description: req.Description,
		StartOnBoot: req.StartOnBoot,
		AutoRestart: req.AutoRestart,
		CreatedBy:   userID.(string),
	}

	if err := database.DB.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create script"})
		return
	}

	// Initialize process state
	processState := models.ProcessState{
		ID:       uuid.New().String(),
		ScriptID: script.ID,
		Status:   "stopped",
		PID:      0,
	}
	database.DB.Create(&processState)

	c.JSON(http.StatusCreated, script)
}

// UpdateScriptHandler updates a script
func UpdateScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	var req UpdateScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Update fields
	updates := models.Script{
		Name:        req.Name,
		Description: req.Description,
		StartOnBoot: req.StartOnBoot,
		AutoRestart: req.AutoRestart,
	}

	if err := database.DB.Model(&script).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update script"})
		return
	}

	c.JSON(http.StatusOK, script)
}

// DeleteScriptHandler deletes a script
func DeleteScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")

	if err := database.DB.Delete(&models.Script{}, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete script"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "script deleted"})
}


// DuplicateScriptHandler duplicates a script
func DuplicateScriptHandler(c *gin.Context) {
	scriptID := c.Param("id")
	userID, _ := c.Get("user_id")

	var script models.Script
	if err := database.DB.First(&script, "id = ?", scriptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	// Create new script with same content
	newScript := models.Script{
		ID:          uuid.New().String(),
		Name:        script.Name + " (copy)",
		Path:        script.Path + ".copy.py", // Simple copy suffix
		Description: script.Description,
		StartOnBoot: false,
		AutoRestart: false,
		CreatedBy:   userID.(string),
	}

	if err := database.DB.Create(&newScript).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to duplicate script"})
		return
	}

	// Copy file
	content, err := os.ReadFile(script.Path)
	if err == nil {
		os.WriteFile(newScript.Path, content, 0644)
	}

	// Initialize process state
	processState := models.ProcessState{
		ID:       uuid.New().String(),
		ScriptID: newScript.ID,
		Status:   "stopped",
		PID:      0,
	}
	database.DB.Create(&processState)

	c.JSON(http.StatusCreated, newScript)
}
