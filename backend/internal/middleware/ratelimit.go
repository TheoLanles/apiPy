package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// --- Token Bucket Rate Limiter (in-memory, per-IP) ---

type bucket struct {
	tokens    float64
	lastCheck time.Time
}

// RateLimiter holds the state for a rate-limiting policy
type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*bucket
	rate     float64       // tokens added per second
	burst    float64       // max tokens (burst capacity)
	cleanupInterval time.Duration
}

// NewRateLimiter creates a rate limiter.
//   - ratePerMinute: how many requests per minute are allowed (steady state)
//   - burst: max burst size (allows short spikes)
func NewRateLimiter(ratePerMinute float64, burst float64) *RateLimiter {
	rl := &RateLimiter{
		clients:         make(map[string]*bucket),
		rate:            ratePerMinute / 60.0, // convert to per-second
		burst:           burst,
		cleanupInterval: 5 * time.Minute,
	}

	// Background goroutine to clean up stale entries and prevent memory leak
	go rl.cleanup()

	return rl
}

// Allow checks if a request from the given key is allowed
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	b, exists := rl.clients[key]
	if !exists {
		rl.clients[key] = &bucket{
			tokens:    rl.burst - 1, // consume one token immediately
			lastCheck: now,
		}
		return true
	}

	// Add tokens based on elapsed time
	elapsed := now.Sub(b.lastCheck).Seconds()
	b.tokens += elapsed * rl.rate
	if b.tokens > rl.burst {
		b.tokens = rl.burst
	}
	b.lastCheck = now

	// Try to consume one token
	if b.tokens >= 1 {
		b.tokens--
		return true
	}

	return false
}

// cleanup removes stale entries every interval
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-10 * time.Minute)
		for key, b := range rl.clients {
			if b.lastCheck.Before(cutoff) {
				delete(rl.clients, key)
			}
		}
		rl.mu.Unlock()
	}
}

// getClientIP extracts the real client IP, respecting reverse proxy headers
func getClientIP(c *gin.Context) string {
	// Trust X-Forwarded-For if behind a reverse proxy
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		return xff
	}
	if xri := c.GetHeader("X-Real-Ip"); xri != "" {
		return xri
	}
	return c.ClientIP()
}

// RateLimitMiddleware creates a Gin middleware from a RateLimiter
func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := getClientIP(c)

		if !rl.Allow(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
