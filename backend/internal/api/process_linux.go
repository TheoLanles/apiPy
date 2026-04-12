//go:build linux || darwin
// +build linux darwin

package api

import (
	"fmt"
	"os/exec"
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

// KillProcessByPort finds the process using the given port and kills it
func KillProcessByPort(port int) error {
	// Check if fuser is installed
	_, err := exec.LookPath("fuser")
	if err != nil {
		return fmt.Errorf("the 'fuser' command was not found. Please install it with 'sudo apt install psmisc'")
	}

	// fuser -k port/tcp is the most direct way on Debian
	// Exit status 1 from fuser usually means 'no process found'
	cmd := exec.Command("fuser", "-k", fmt.Sprintf("%d/tcp", port))
	err = cmd.Run()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			// If exit code is 1, it just means no process was listening on that port
			if exitErr.ExitCode() == 1 {
				return nil 
			}
		}
		return fmt.Errorf("failed to kill process: %v (make sure the app has root privileges)", err)
	}
	return nil
}
