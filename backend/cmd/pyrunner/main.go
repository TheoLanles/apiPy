package main

import (
	"io/fs"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/theo/pyrunner/internal/api"
	"github.com/theo/pyrunner/internal/assets"
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

	// Load or auto-generate JWT secret from database
	middleware.InitJWTSecret(database.DB)

	// Load CORS allowed domain from database
	middleware.InitCORS(database.DB)

	// Initialize scripts directory
	if err := api.InitScriptsDir(); err != nil {
		log.Fatalf("Failed to initialize scripts directory: %v", err)
	}

	// Start log buffering service
	api.StartLogBuffer()

	// Start log retention (cleanup old logs every hour)
	database.StartLogRetention()

	// Create Gin router
	router := gin.Default()
	router.RedirectTrailingSlash = false
	router.RedirectFixedPath = false

	// Set max multipart upload size (100MB)
	router.MaxMultipartMemory = 100 << 20

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.SecurityHeadersMiddleware())

	// Rate limiters (per-IP, in-memory token bucket)
	authLimiter := middleware.NewRateLimiter(5, 5)      // 5 req/min, burst 5 (login, setup)
	apiLimiter := middleware.NewRateLimiter(100, 30)     // 100 req/min, burst 30 (general API)
	uploadLimiter := middleware.NewRateLimiter(10, 3)    // 10 req/min, burst 3 (file uploads)

	// Public routes (no auth, strict rate-limit on login)
	public := router.Group("/api")
	{
		public.GET("/health", api.HealthHandler)
		public.POST("/setup", middleware.RateLimitMiddleware(authLimiter), api.SetupHandler)
		public.POST("/auth/login", middleware.RateLimitMiddleware(authLimiter), api.LoginHandler)
		public.POST("/auth/logout", api.LogoutHandler)
		public.GET("/auth/oidc/login", middleware.RateLimitMiddleware(authLimiter), api.OIDCLoginHandler)
		public.GET("/auth/oidc/callback", api.OIDCCallbackHandler)
	}

	// Protected routes (requires auth + general rate-limit)
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	protected.Use(middleware.RateLimitMiddleware(apiLimiter))
	{
		// Auth
		protected.GET("/auth/me", api.MeHandler)

		// Scripts CRUD
		protected.GET("/scripts", api.GetScriptsHandler)
		protected.POST("/scripts", api.CreateScriptHandler)
		protected.POST("/scripts/upload", middleware.RateLimitMiddleware(uploadLimiter), api.UploadScriptHandler)
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
		protected.GET("/scripts/status", api.GetAllScriptsStatusHandler)

		// Bulk operations
		protected.POST("/scripts/bulk/start", api.BulkStartHandler)
		protected.POST("/scripts/bulk/stop", api.BulkStopHandler)

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
			adminSettings.POST("/test-webhook", api.TestDiscordWebhookHandler)
			adminSettings.POST("/update", api.UpdateSystemHandler)
			adminSettings.POST("/debug/kill-port", api.KillPortHandler)
		}
	}

	// WebSocket routes (no middleware for now)
	wsRoutes := router.Group("")
	{
		wsRoutes.GET("/ws/scripts/:id/logs", ws.LogsWebSocketHandler)
	}

	// Serve frontend assets
	assets.ListFiles()
	serveFrontend(router)

	// Start server
	log.Println("Starting PyRunner API on :8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// serveFrontend serves the Next.js frontend from embedded assets
func serveFrontend(router *gin.Engine) {
	fsys := assets.GetFS()
	fileServer := http.FileServer(http.FS(fsys))

	// Check if assets are loaded
	if f, err := fsys.Open("index.html"); err != nil {
		log.Printf("WARNING: index.html not found in embedded assets: %v", err)
	} else {
		f.Close()
		log.Println("Embedded frontend assets loaded successfully")
	}

	router.NoRoute(func(c *gin.Context) {
		reqPath := c.Request.URL.Path

		// 1. API and WS routes should always 404 if not matched by their groups
		if strings.HasPrefix(reqPath, "/api") || strings.HasPrefix(reqPath, "/ws") {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}

		cleanedPath := strings.TrimPrefix(reqPath, "/")

		// 2. Try to serve the exact file (css, js, images, etc.)
		if cleanedPath != "" {
			if f, err := fsys.Open(cleanedPath); err == nil {
				defer f.Close()
				if info, err := f.Stat(); err == nil && !info.IsDir() {
					fileServer.ServeHTTP(c.Writer, c.Request)
					return
				}
			}
		}

		// 3. Try directory/index.html (for paths like /dashboard/ or /dashboard)
		indexPath := path.Join(cleanedPath, "index.html")
		if _, err := fs.Stat(fsys, indexPath); err == nil {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		// 4. SPA Fallback
		// We only fallback for paths that look like "pages" (no extension or .html)
		// This prevents serving HTML when the browser expects missing .js/.css scripts
		ext := path.Ext(cleanedPath)
		if ext == "" || ext == ".html" {
			if data, err := fs.ReadFile(fsys, "index.html"); err == nil {
				c.Data(200, "text/html; charset=utf-8", data)
				return
			}
		}

		// 5. Final 404 for missing static assets
		c.Status(404)
	})
}
