package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/middleware"
	"github.com/theo/pyrunner/internal/models"
	"golang.org/x/crypto/bcrypt"
	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
	"strings"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SetupRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type AuthResponse struct {
	ID    string    `json:"id"`
	Username string `json:"username"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	Token  string    `json:"token"`
}

// SetupHandler creates the first admin user
func SetupHandler(c *gin.Context) {
	// Check if any user exists
	var count int64
	if err := database.DB.Model(&models.User{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check users"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "setup already completed"})
		return
	}

	var req SetupRequest
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
		Role:     "admin",
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(middleware.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("auth_token", tokenString, 86400, "/", "", middleware.IsSecureRequest(c), true)

	c.JSON(http.StatusOK, AuthResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		Token:    tokenString,
	})
}

// LoginHandler authenticates a user
func LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(middleware.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("auth_token", tokenString, 86400, "/", "", middleware.IsSecureRequest(c), true)

	c.JSON(http.StatusOK, AuthResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		Token:    tokenString,
	})
}

// LogoutHandler clears the auth token
func LogoutHandler(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("auth_token", "", -1, "/", "", middleware.IsSecureRequest(c), true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// MeHandler returns the current user
func MeHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
	})
}

// OIDCLoginHandler redirects the user to the OIDC provider
func OIDCLoginHandler(c *gin.Context) {
	var settings models.Settings
	if err := database.DB.First(&settings).Error; err != nil || !settings.OIDCEnabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OIDC is not enabled"})
		return
	}

	provider, err := oidc.NewProvider(c.Request.Context(), settings.OIDCIssuer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize OIDC provider: " + err.Error()})
		return
	}

	oauth2Config := oauth2.Config{
		ClientID:     settings.OIDCClientID,
		ClientSecret: settings.OIDCClientSecret,
		RedirectURL:  settings.OIDCRedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	state := uuid.New().String()
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("oidc_state", state, 300, "/", "", middleware.IsSecureRequest(c), true)

	c.Redirect(http.StatusFound, oauth2Config.AuthCodeURL(state))
}

// OIDCCallbackHandler handles the redirect from the OIDC provider
func OIDCCallbackHandler(c *gin.Context) {
	var settings models.Settings
	if err := database.DB.First(&settings).Error; err != nil || !settings.OIDCEnabled {
		c.Redirect(http.StatusFound, "/login?error=oidc_disabled")
		return
	}

	// Verify state
	state, err := c.Cookie("oidc_state")
	if err != nil || state != c.Query("state") {
		c.Redirect(http.StatusFound, "/login?error=invalid_state")
		return
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("oidc_state", "", -1, "/", "", middleware.IsSecureRequest(c), true)

	provider, err := oidc.NewProvider(c.Request.Context(), settings.OIDCIssuer)
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=provider_init_failed")
		return
	}

	oauth2Config := oauth2.Config{
		ClientID:     settings.OIDCClientID,
		ClientSecret: settings.OIDCClientSecret,
		RedirectURL:  settings.OIDCRedirectURL,
		Endpoint:     provider.Endpoint(),
	}

	token, err := oauth2Config.Exchange(c.Request.Context(), c.Query("code"))
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=code_exchange_failed")
		return
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		c.Redirect(http.StatusFound, "/login?error=no_id_token")
		return
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: settings.OIDCClientID})
	idToken, err := verifier.Verify(c.Request.Context(), rawIDToken)
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=token_verification_failed")
		return
	}

	var claims struct {
		Email    string `json:"email"`
		Username string `json:"preferred_username"`
		Name     string `json:"name"`
	}
	if err := idToken.Claims(&claims); err != nil {
		c.Redirect(http.StatusFound, "/login?error=claims_extraction_failed")
		return
	}

	if claims.Email == "" {
		c.Redirect(http.StatusFound, "/login?error=no_email_in_claims")
		return
	}

	// Find or Create User
	var user models.User
	if err := database.DB.Where("email = ?", claims.Email).First(&user).Error; err != nil {
		// Create new user
		username := claims.Username
		if username == "" {
			username = claims.Name
		}
		if username == "" {
			username = strings.Split(claims.Email, "@")[0]
		}

		user = models.User{
			ID:       uuid.New().String(),
			Username: username,
			Email:    claims.Email,
			Role:     "user", // Default role
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.Redirect(http.StatusFound, "/login?error=user_creation_failed")
			return
		}
	}

	// Generate JWT
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := jwtToken.SignedString([]byte(middleware.JWTSecret))
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=token_generation_failed")
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("auth_token", tokenString, 86400, "/", "", middleware.IsSecureRequest(c), true)
	c.Redirect(http.StatusFound, "/dashboard")
}
