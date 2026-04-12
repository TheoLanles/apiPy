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
	if pid == 0 {
		return nil
	}
	// Negative PID targets the entire process group
	return syscall.Kill(-pid, syscall.SIGKILL)
}

// KillProcessByPort finds the process using the given port and kills it
func KillProcessByPort(port int) error {
	// fuser -k port/tcp is the most direct way on Debian
	return exec.Command("fuser", "-k", fmt.Sprintf("%d/tcp", port)).Run()
}
