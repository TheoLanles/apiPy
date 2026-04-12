package api

import (
	"os/exec"
)

// getSystemPython detects whether 'python' or 'python3' is available on the system.
// It defaults to 'python' if neither is found.
func getSystemPython() string {
	// Check for 'python'
	if _, err := exec.LookPath("python"); err == nil {
		return "python"
	}
	// Check for 'python3'
	if _, err := exec.LookPath("python3"); err == nil {
		return "python3"
	}
	// Default fallback
	return "python"
}
