package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// JWTSecret is loaded from the database at startup (auto-generated if absent)
var JWTSecret string

// InitJWTSecret loads the JWT secret from the database or generates a new one.
// Must be called after database.Init() and AutoMigrate.
func InitJWTSecret(db *gorm.DB) {
	type settingsRow struct {
		ID        uint
		JWTSecret string `gorm:"column:jwt_secret"`
	}

	var row settingsRow
	result := db.Table("settings").First(&row)

	if result.Error != nil {
		// No settings row exists yet — create one with a fresh secret
		secret := generateJWTSecret()
		db.Exec("INSERT INTO settings (id, jwt_secret) VALUES (1, ?)", secret)
		JWTSecret = secret
		log.Println("✅ JWT secret generated and saved to database (new install)")
		return
	}

	if row.JWTSecret != "" {
		JWTSecret = row.JWTSecret
		log.Println("✅ JWT secret loaded from database")
		return
	}

	// Settings row exists but has no secret (upgrade from old version)
	secret := generateJWTSecret()
	db.Table("settings").Where("id = ?", row.ID).Update("jwt_secret", secret)
	JWTSecret = secret
	log.Println("✅ JWT secret generated and saved to database (upgrade)")
}

// generateJWTSecret creates a cryptographically secure 64-byte random key
func generateJWTSecret() string {
	key := make([]byte, 64)
	if _, err := rand.Read(key); err != nil {
		log.Fatalf("FATAL: Failed to generate JWT secret: %v", err)
	}
	return base64.URLEncoding.EncodeToString(key)
}

// AuthMiddleware validates JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// Try to get from cookies
			tokenString, err := c.Cookie("auth_token")
			if err != nil {
				c.JSON(401, gin.H{"error": "missing authorization header"})
				c.Abort()
				return
			}
			authHeader = "Bearer " + tokenString
		}

		// Parse Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(401, gin.H{"error": "invalid authorization header"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(401, gin.H{"error": "invalid claims"})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("user_id", claims["sub"])
		c.Set("user_role", claims["role"])
		c.Next()
	}
}

// AdminMiddleware checks if user is admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists || role != "admin" {
			c.JSON(403, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// --- CORS configuration with cached allowed origin ---

var (
	corsDomain string
	corsMu     sync.RWMutex
)

// SetCORSDomain updates the cached CORS domain (called at startup and on settings save)
func SetCORSDomain(domain string) {
	corsMu.Lock()
	corsDomain = strings.TrimRight(strings.TrimSpace(domain), "/")
	corsMu.Unlock()
}

// InitCORS loads the CORS domain from the database at startup
func InitCORS(db *gorm.DB) {
	type row struct {
		CORSDomain string `gorm:"column:cors_domain"`
	}
	var r row
	if err := db.Table("settings").First(&r).Error; err == nil && r.CORSDomain != "" {
		SetCORSDomain(r.CORSDomain)
		log.Printf("✅ CORS domain loaded: %s", r.CORSDomain)
	} else {
		log.Println("ℹ️  No CORS domain configured — only localhost origins allowed")
	}
}

// IsAllowedOrigin checks if the request origin is in the whitelist (exported for WS reuse)
func IsAllowedOrigin(origin string) bool {
	// Localhost is always allowed (dev + embedded mode)
	if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
		return true
	}

	corsMu.RLock()
	allowed := corsDomain
	corsMu.RUnlock()

	if allowed == "" {
		return false
	}
	return origin == allowed
}

// ValidateJWT parses and validates a JWT token string, returns (userID, role, error)
func ValidateJWT(tokenString string) (string, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid claims")
	}

	userID, _ := claims["sub"].(string)
	role, _ := claims["role"].(string)
	return userID, role, nil
}

// CORSMiddleware handles CORS with a secure whitelist
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" && IsAllowedOrigin(origin) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Writer.Header().Set("Vary", "Origin")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
