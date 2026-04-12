//go:build windows
// +build windows

package api

import (
	"fmt"
	"os/exec"
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
	return exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprint(pid)).Run()
}
