package api

import (
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

type LogEntry struct {
	ScriptID string
	Content  string
	Level    string
}

var (
	logChan       = make(chan LogEntry, 5000)
	buffer        []models.ScriptLog
	bufMutex      sync.Mutex
	flushInterval = 1 * time.Second
	batchSize     = 100
)

// StartLogBuffer starts the background log aggregator that batches DB writes
func StartLogBuffer() {
	go func() {
		ticker := time.NewTicker(flushInterval)
		defer ticker.Stop()

		for {
			select {
			case entry := <-logChan:
				bufMutex.Lock()
				buffer = append(buffer, models.ScriptLog{
					ID:       uuid.New().String(),
					ScriptID: entry.ScriptID,
					Line:     entry.Content,
					Level:    entry.Level,
				})
				reachedBatch := len(buffer) >= batchSize
				bufMutex.Unlock()

				if reachedBatch {
					flushLogs()
				}

			case <-ticker.C:
				flushLogs()
			}
		}
	}()
}

func flushLogs() {
	bufMutex.Lock()
	if len(buffer) == 0 {
		bufMutex.Unlock()
		return
	}

	toInsert := buffer
	buffer = nil
	bufMutex.Unlock()

	// Batch insert into database
	if err := database.DB.Create(&toInsert).Error; err != nil {
		log.Printf("ERROR: Failed to batch insert logs: %v", err)
	}
}

// QueueLog adds a log to the buffer channel
func QueueLog(scriptID, content, level string) {
	logChan <- LogEntry{
		ScriptID: scriptID,
		Content:  content,
		Level:    level,
	}
}
