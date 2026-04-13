package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin user"`
}

// GetUsersHandler lists all users (admin only)
func GetUsersHandler(c *gin.Context) {
	users := []models.User{}
	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	// Don't expose passwords
	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

// CreateUserHandler creates a new user (admin only)
func CreateUserHandler(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		ID:       uuid.New().String(),
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPwd),
		Role:     req.Role,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	user.Password = "" // Don't expose password
	c.JSON(http.StatusCreated, user)
}

// DeleteUserHandler deletes a user (admin only)
func DeleteUserHandler(c *gin.Context) {
	targetID := c.Param("id")
	currentUserID, _ := c.Get("user_id")

	// Prevent self-deletion
	if targetID == currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you cannot delete your own account"})
		return
	}

	// Check if the target user exists and is an admin
	var targetUser models.User
	if err := database.DB.First(&targetUser, "id = ?", targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// If deleting an admin, ensure at least one admin remains
	if targetUser.Role == "admin" {
		var adminCount int64
		database.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
		if adminCount <= 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete the last admin account"})
			return
		}
	}

	if err := database.DB.Delete(&models.User{}, "id = ?", targetID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

// GetUserHandler returns a specific user
func GetUserHandler(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}
