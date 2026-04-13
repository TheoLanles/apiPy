//go:build windows
// +build windows

package api

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
)

// ConfigureSysProcAttr sets Windows-specific process attributes
func ConfigureSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
}

// KillProcessTree kills the process and all its children on Windows
func KillProcessTree(pid int) error {
	if pid <= 0 {
		return nil
	}
	// We ignore the error because taskkill returns exit code 128/1 if the process is already dead,
	// which we consider a success for a "stop" operation.
	_ = exec.Command("taskkill", "/F", "/T", "/PID", strconv.Itoa(pid)).Run()
	return nil
}

// FindPIDByPort finds the PID of the process listening on the given port (Windows)
// Uses netstat with safe argument handling (no shell interpolation)
func FindPIDByPort(port int) (int, error) {
	// Validate port is a number (already int, but be defensive)
	if port <= 0 || port > 65535 {
		return 0, fmt.Errorf("invalid port: %d", port)
	}

	// Use netstat directly with safe arguments — no shell piping
	cmd := exec.Command("netstat", "-ano")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("failed to run netstat: %v", err)
	}

	// Search for the port in Go instead of piping through findstr
	portStr := fmt.Sprintf(":%d", port)
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.Contains(line, portStr) {
			continue
		}
		// Only match LISTENING state
		if !strings.Contains(strings.ToUpper(line), "LISTENING") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 5 {
			pid, err := parsePID(fields[4])
			if err == nil {
				return pid, nil
			}
		}
	}

	return 0, fmt.Errorf("no process found listening on port %d", port)
}

// KillProcessByPort finds the process using the given port and kills it
// DEPRECATED: Use FindPIDByPort + isManagedPID + KillProcessTree instead (via KillPortHandler)
func KillProcessByPort(port int) error {
	pid, err := FindPIDByPort(port)
	if err != nil {
		return err
	}
	return KillProcessTree(pid)
}
