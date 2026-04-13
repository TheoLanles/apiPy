package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a system user
type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex" json:"username"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Password  string    `json:"-"` // Never expose in API
	Role      string    `json:"role"` // "admin" or "user"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Script represents a Python script
type Script struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Path        string    `json:"path"` // File path to the script
	Description string    `json:"description"`
	CreatedBy   string    `json:"created_by"` // User ID
	StartOnBoot bool      `json:"start_on_boot"`
	AutoRestart bool      `json:"auto_restart"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// ScriptLog represents a log line
type ScriptLog struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	ScriptID  string    `gorm:"index" json:"script_id"`
	Line      string    `json:"line"`
	Level     string    `json:"level"` // INFO, WARNING, ERROR
	CreatedAt time.Time `json:"created_at"`
}

// ProcessState tracks the runtime state of a script
type ProcessState struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	ScriptID  string    `gorm:"uniqueIndex" json:"script_id"`
	PID       int       `json:"pid"`
	Status    string    `json:"status"` // running, stopped, error, crashed
	StartedAt *time.Time `json:"started_at"`
	StoppedAt *time.Time `json:"stopped_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Settings represents global system settings
type Settings struct {
	ID                uint   `gorm:"primaryKey" json:"id"`
	DiscordWebhookURL string `json:"discord_webhook_url"`
	OIDCEnabled       bool   `json:"oidc_enabled"`
	OIDCIssuer        string `json:"oidc_issuer"`
	OIDCClientID      string `json:"oidc_client_id"`
	OIDCClientSecret  string `json:"oidc_client_secret"`
	OIDCRedirectURL   string `json:"oidc_redirect_url"`
}
