//go:build linux || darwin
// +build linux darwin

package api

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
)

// ConfigureSysProcAttr sets Linux/Unix-specific process attributes
func ConfigureSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		Setpgid: true,
	}
}

// KillProcessTree kills the process and all its children on Linux
func KillProcessTree(pid int) error {
	if pid <= 0 {
		return nil
	}

	// 1. Attempt to kill the entire process group (negative PID)
	// This works because we start processes with Setpgid: true
	err := syscall.Kill(-pid, syscall.SIGKILL)
	
	// 2. Fallback: Kill the process directly if group kill failed
	// (e.g., if the process is no longer the group leader or group doesn't exist)
	if err != nil {
		syscall.Kill(pid, syscall.SIGKILL)
	}
	
	return nil
}

// FindPIDByPort finds the PID of the process listening on the given port (Linux/macOS)
// Uses lsof with safe argument handling
func FindPIDByPort(port int) (int, error) {
	if port <= 0 || port > 65535 {
		return 0, fmt.Errorf("invalid port: %d", port)
	}

	// Use lsof to find PID — safe, no shell interpolation
	cmd := exec.Command("lsof", "-ti", fmt.Sprintf("tcp:%d", port))
	output, err := cmd.Output()
	if err != nil {
		// Try ss as fallback
		cmd = exec.Command("ss", "-tlnp", fmt.Sprintf("sport = :%d", port))
		output, err = cmd.Output()
		if err != nil {
			return 0, fmt.Errorf("no process found listening on port %d", port)
		}
		// Parse ss output to find PID
		return parseSsOutput(string(output))
	}

	// lsof outputs one PID per line
	pidStr := strings.TrimSpace(string(output))
	lines := strings.Split(pidStr, "\n")
	if len(lines) > 0 && lines[0] != "" {
		pid, err := strconv.Atoi(strings.TrimSpace(lines[0]))
		if err == nil && pid > 0 {
			return pid, nil
		}
	}

	return 0, fmt.Errorf("no process found listening on port %d", port)
}

// parseSsOutput extracts PID from ss -tlnp output
func parseSsOutput(output string) (int, error) {
	// ss output contains lines like: LISTEN  0  128  *:3000  *:*  users:(("python",pid=12345,fd=3))
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if idx := strings.Index(line, "pid="); idx != -1 {
			rest := line[idx+4:]
			if commaIdx := strings.IndexAny(rest, ",)"); commaIdx != -1 {
				pidStr := rest[:commaIdx]
				pid, err := strconv.Atoi(pidStr)
				if err == nil && pid > 0 {
					return pid, nil
				}
			}
		}
	}
	return 0, fmt.Errorf("could not parse PID from ss output")
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
