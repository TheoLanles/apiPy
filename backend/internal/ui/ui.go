package ui

import (
	"embed"
	"io/fs"
)

// StaticAssets is a file system containing the embedded frontend
// To build: first run `npm run build` in frontend/apipy
// then move the `out` folder to this directory.
//
//go:embed all:out
var StaticAssets embed.FS

// GetFS returns the static assets as a sub-filesystem
func GetFS() (fs.FS, error) {
	return fs.Sub(StaticAssets, "out")
}
