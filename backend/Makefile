.PHONY: build run dev clean test

# Build the binary
build:
	go build -o bin/pyrunner.exe ./cmd/pyrunner

# Run the application
run: build
	./bin/pyrunner.exe

# Run in development mode with hot reload
dev:
	go run ./cmd/pyrunner/main.go

# Clean build artifacts
clean:
	rm -rf bin/

# Download dependencies
deps:
	go mod download
	go mod tidy

# Run tests
test:
	go test ./...

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run
