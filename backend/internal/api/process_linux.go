//go:build linux || darwin
// +build linux darwin

package api

import (
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
	// Negative PID targets the entire process group
	return syscall.Kill(-pid, syscall.SIGKILL)
}
