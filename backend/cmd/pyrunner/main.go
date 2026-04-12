package main

import (
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/api"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/middleware"
	"github.com/theo/pyrunner/internal/ws"
)

func main() {
	// Initialize database
	dbPath := filepath.Join(".", "pyrunner.db")
	if err := database.Init(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize scripts directory
	if err := api.InitScriptsDir(); err != nil {
		log.Fatalf("Failed to initialize scripts directory: %v", err)
	}

	// Create Gin router
	router := gin.Default()

	// Set max multipart upload size (100MB)
	router.MaxMultipartMemory = 100 << 20

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Public routes (no auth)
	public := router.Group("/api")
	{
		public.GET("/health", api.HealthHandler)
		public.POST("/setup", api.SetupHandler)
		public.POST("/auth/login", api.LoginHandler)
		public.POST("/auth/logout", api.LogoutHandler)
	}

	// Protected routes (requires auth)
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// Auth
		protected.GET("/auth/me", api.MeHandler)

		// Scripts CRUD
		protected.GET("/scripts", api.GetScriptsHandler)
		protected.POST("/scripts", api.CreateScriptHandler)
		protected.POST("/scripts/upload", api.UploadScriptHandler)
		protected.GET("/scripts/:id", api.GetScriptHandler)
		protected.PUT("/scripts/:id", api.UpdateScriptHandler)
		protected.DELETE("/scripts/:id", api.DeleteScriptFileHandler)
		protected.POST("/scripts/:id/duplicate", api.DuplicateScriptHandler)
		protected.POST("/scripts/:id/reinstall", api.ReinstallDependenciesHandler)

		// Script file operations
		protected.GET("/scripts/:id/file", api.GetScriptFileHandler)
		protected.PUT("/scripts/:id/file", api.UpdateScriptFileHandler)

		// Script execution
		protected.POST("/scripts/:id/start", api.StartScriptHandler)
		protected.POST("/scripts/:id/stop", api.StopScriptHandler)
		protected.POST("/scripts/:id/restart", api.RestartScriptHandler)
		protected.GET("/scripts/:id/status", api.GetScriptStatusHandler)

		// Script logs
		protected.GET("/scripts/:id/logs", api.GetLogsHandler)
		protected.DELETE("/scripts/:id/logs", api.DeleteLogsHandler)
		protected.GET("/scripts/:id/logs/download", api.DownloadLogsHandler)

		// Users (admin only)
		adminUsers := protected.Group("/users")
		adminUsers.Use(middleware.AdminMiddleware())
		{
			adminUsers.GET("", api.GetUsersHandler)
			adminUsers.POST("", api.CreateUserHandler)
			adminUsers.GET("/:id", api.GetUserHandler)
			adminUsers.DELETE("/:id", api.DeleteUserHandler)
		}

		// Settings
		protected.GET("/settings", api.GetSettingsHandler)
		adminSettings := protected.Group("/settings")
		adminSettings.Use(middleware.AdminMiddleware())
		{
			adminSettings.POST("", api.UpdateSettingsHandler)
		}
	}

	// WebSocket routes (no middleware for now)
	wsRoutes := router.Group("")
	{
		wsRoutes.GET("/ws/scripts/:id/logs", ws.LogsWebSocketHandler)
	}

	// Serve frontend assets
	serveFrontend(router)

	// Start server
	log.Println("Starting PyRunner API on :8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// serveFrontend serves the Next.js frontend
func serveFrontend(router *gin.Engine) {
	// Serve _next folder (Next.js static assets)
	router.StaticFS("/_next/static", http.Dir("./frontend/apipy/.next/static"))

	// Serve public folder
	router.StaticFS("/public", http.Dir("./frontend/apipy/public"))

	// Serve SPA - all other routes return bootstrap HTML
	router.NoRoute(func(c *gin.Context) {
		// Don't serve HTML for API routes
		if strings.HasPrefix(c.Request.URL.Path, "/api") || strings.HasPrefix(c.Request.URL.Path, "/ws") {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		// Serve index.html for SPA routing
		c.File("./frontend/apipy/out/index.html")
	})
}
