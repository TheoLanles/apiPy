package database

import (
	"log"
	"time"
)

const (
	// LogRetentionDays is how many days of logs to keep
	LogRetentionDays = 7

	// MaxLogsPerScript is the maximum number of log entries per script
	MaxLogsPerScript = 50000

	// CleanupInterval is how often the cleanup job runs
	CleanupInterval = 1 * time.Hour
)

// StartLogRetention launches a background goroutine that periodically
// cleans up old logs and caps per-script log counts.
func StartLogRetention() {
	// Run once at startup
	go func() {
		time.Sleep(10 * time.Second) // Wait for DB to be fully ready
		runLogCleanup()

		ticker := time.NewTicker(CleanupInterval)
		defer ticker.Stop()

		for range ticker.C {
			runLogCleanup()
		}
	}()

	log.Printf("✅ Log retention started (keep %d days, max %d per script, cleanup every %s)",
		LogRetentionDays, MaxLogsPerScript, CleanupInterval)
}

func runLogCleanup() {
	if DB == nil {
		return
	}

	// 1. Delete logs older than retention period
	cutoff := time.Now().AddDate(0, 0, -LogRetentionDays)
	result := DB.Exec("DELETE FROM script_logs WHERE created_at < ?", cutoff)
	if result.Error != nil {
		log.Printf("⚠️ Log retention (age): %v", result.Error)
	} else if result.RowsAffected > 0 {
		log.Printf("🧹 Log retention: deleted %d logs older than %d days", result.RowsAffected, LogRetentionDays)
	}

	// 2. Cap per-script logs: keep only the most recent MaxLogsPerScript entries
	// Find scripts that exceed the limit
	type scriptCount struct {
		ScriptID string
		LogCount int64
	}
	var overflows []scriptCount
	DB.Raw(`
		SELECT script_id, COUNT(*) as log_count 
		FROM script_logs 
		GROUP BY script_id 
		HAVING log_count > ?
	`, MaxLogsPerScript).Scan(&overflows)

	for _, s := range overflows {
		excess := s.LogCount - int64(MaxLogsPerScript)
		result := DB.Exec(`
			DELETE FROM script_logs WHERE id IN (
				SELECT id FROM script_logs 
				WHERE script_id = ? 
				ORDER BY created_at ASC 
				LIMIT ?
			)
		`, s.ScriptID, excess)

		if result.Error != nil {
			log.Printf("⚠️ Log retention (cap) script %s: %v", s.ScriptID, result.Error)
		} else if result.RowsAffected > 0 {
			log.Printf("🧹 Log retention: trimmed %d excess logs for script %s", result.RowsAffected, s.ScriptID)
		}
	}

	// 3. Trigger incremental vacuum to reclaim disk space
	DB.Exec("PRAGMA incremental_vacuum;")
}
