package database

import (
	"fmt"
	"log"

	"github.com/theo/pyrunner/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Init initializes the database connection
func Init(dataSourceName string) error {
	var err error
	DB, err = gorm.Open(sqlite.Open(dataSourceName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Performance optimizations for SQLite
	sqlDB, err := DB.DB()
	if err == nil {
		sqlDB.SetMaxOpenConns(1)
		DB.Exec("PRAGMA journal_mode=WAL;")
		DB.Exec("PRAGMA synchronous=NORMAL;")
		DB.Exec("PRAGMA auto_vacuum=INCREMENTAL;")
	}

	// Auto-migrate all models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Script{},
		&models.ScriptLog{},
		&models.ProcessState{},
		&models.Settings{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
