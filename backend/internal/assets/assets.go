package assets

import (
	"embed"
	"io/fs"
	"log"
)

//go:embed all:dist
var embeddedFiles embed.FS

// GetFS returns the static assets filesystem
func GetFS() fs.FS {
	fsys, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		panic(err)
	}
	return fsys
}

// ListFiles prints all embedded files for debugging
func ListFiles() {
	fs.WalkDir(embeddedFiles, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			log.Printf("Embedded file found: %s", path)
		}
		return nil
	})
}
