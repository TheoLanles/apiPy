<img width="1000" height="1000" alt="header" src="https://github.com/user-attachments/assets/55cabcc8-4c1a-46e6-82e9-58bf6bf597d8" />

---

PyRunner is a modern, high-performance web dashboard designed to manage, execute, and monitor Python scripts. Built with a Go backend and a Next.js frontend, it provides a professional environment for automation and script orchestration.

---

## Features

- **Full Script Management**: Create, upload, edit, and organize Python scripts.
- **Real-time Control**: Start, stop, and restart scripts with live status tracking.
- **WebSocket Log Streaming**: Monitor script execution in real-time through WebSocket streaming.
- **Secure Authentication**: JWT-based authentication with role-based access control (Admin and User).
- **Premium Interface**: Modern dashboard with dark mode support, built using Shadcn/UI.
- **Environment Management**: Configure environment variables and manage dependencies directly from the interface.
- **Persistent Logs**: History of script outputs stored for later analysis.

---

## Technical Stack

### Backend
- **Language**: Go (1.21+)
- **Framework**: Gin Gonic
- **Database**: SQLite with GORM
- **Authentication**: JWT (JSON Web Tokens)
- **Communication**: WebSockets for real-time log streaming

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS & Shadcn/UI
- **State Management**: Zustand
- **Icons**: Lucide React

---

## Deployment

### Quick Linux Deployment (Debian/Ubuntu)

For a rapid deployment on a Linux server, run the following command:

```bash
curl -sSL https://raw.githubusercontent.com/TheoLanles/apiPy/main/install.sh | sudo bash
```

### Proxmox VE LXC Deployment

To deploy apiPy as an LXC container on Proxmox VE, use the following interactive script:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/TheoLanles/apiPy/main/proxmox-lxc.sh)"
```

---

## Manual Installation

### Prerequisites
- Go v1.21 or higher
- Node.js v18 or higher
- Python installed and available in system PATH

### 1. Build the Unified Binary
PyRunner runs as a standalone executable including both the backend and encapsulated frontend assets.

```powershell
# On Windows (PowerShell)
.\build.ps1
```

The build script performs the following actions:
1. Compiles the Next.js frontend into static assets.
2. Embeds the static assets into the Go binary.
3. Generates the final executables in the bin directory.

### 2. Execution
Run the generated executable from the backend directory:

```bash
# Linux
./backend/bin/apiPy

# Windows
.\backend\bin\apiPy.exe
```
The dashboard is accessible by default at `http://localhost:8080`.

---

## Development Guide

### Backend (Hot Reload)
```bash
cd backend
go run ./cmd/pyrunner
```

### Frontend (Hot Reload)
```bash
cd frontend/apipy
npm install
npm run dev
```

---

## Project Structure

```text
api-py/
├── backend/            # Go Gin API
│   ├── cmd/            # Entry points
│   ├── internal/       # Core logic (API, Services, Models)
│   ├── bin/            # Compiled binaries
├── frontend/           # Next.js Application
   └── apipy/           # Main frontend source
```

---

## Configuration

The backend is configured via the `.env` file or environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Port the API listens on | `8080` |
| `DB_PATH` | Path to the SQLite database | `./pyrunner.db` |
| `JWT_SECRET` | Secret key for JWT signing | (Generated at startup) |
| `PYTHON_PATH` | Command to execute Python | `python` |
| `CORS_DOMAIN` | Allowed CORS origin | (Configurable via UI) |

---

## License

This project is licensed under the MIT License.

Developed with ❤️ by [Theo](https://github.com/TheoLanles)
