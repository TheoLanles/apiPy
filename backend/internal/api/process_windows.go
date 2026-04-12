//go:build windows
// +build windows

package api

import (
	"fmt"
	"os/exec"
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
	if pid == 0 {
		return nil
	}
	return exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprint(pid)).Run()
}

// KillProcessByPort finds the process using the given port and kills it
func KillProcessByPort(port int) error {
	// Find PID using netstat
	cmd := exec.Command("cmd", "/c", fmt.Sprintf("netstat -ano | findstr :%d", port))
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("no process found on port %d", port)
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 5 {
			pid := fields[4]
			// Kill the PID
			exec.Command("taskkill", "/F", "/PID", pid).Run()
		}
	}
	return nil
}
