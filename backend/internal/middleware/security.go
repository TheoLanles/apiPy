package middleware

import "github.com/gin-gonic/gin"

// SecurityHeadersMiddleware adds standard security headers to all HTTP responses
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME-type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Control referrer information leakage
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Legacy XSS protection (still useful for older browsers)
		c.Header("X-XSS-Protection", "1; mode=block")

		// Prevent caching of sensitive API responses
		c.Header("Cache-Control", "no-store")

		// Restrict permissions/features the browser can use
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		c.Next()
	}
}
