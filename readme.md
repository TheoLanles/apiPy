<img width="1000" height="1000" alt="header" src="https://github.com/user-attachments/assets/55cabcc8-4c1a-46e6-82e9-58bf6bf597d8" />

---

PyRunner is a modern, high-performance web dashboard designed to manage, execute, and monitor Python scripts effortlessly. Built with a robust **Go** backend and a sleek **Next.js** frontend, it provides a professional-grade environment for automation and script orchestration.

---

## ✨ Features

- 📂 **Full Script CRUD**: Effortlessly create, upload, edit, and organize your Python scripts.
- ⚡ **Real-time Control**: Start, stop, and restart scripts with live status tracking.
- 📜 **Live Streamed Logs**: Watch your scripts execute in real-time via advanced WebSocket streaming.
- 🛡️ **Secure Access**: JWT-based authentication with role-based access control (Admin/User).
- 🎨 **Modern UI**: A premium dashboard experience featuring **Dark Mode**, **Shadcn/UI**, and fluid animations.
- 📦 **Environment Control**: Manage environment variables and reinstall dependencies directly from the UI.
- 🗄️ **Persistent Logs**: Keep a history of your script outputs for later analysis.

---

## 🛠️ Tech Stack

### Backend
- **Language**: [Go (1.21+)](https://go.dev/)
- **Framework**: [Gin Gonic](https://gin-gonic.com/)
- **Database**: [SQLite](https://www.sqlite.org/) with [GORM](https://gorm.io/)
- **Auth**: JWT (JSON Web Tokens)
- **Communication**: WebSockets for real-time log streaming

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Quick Linux Deployment (Debian/Ubuntu)

If you are on a Linux server, you can deploy **apiPy** instantly with this one-liner:

```bash
curl -sSL https://raw.githubusercontent.com/TheoLanles/apiPy/main/install.sh | sudo bash
```

---

## 🚀 Getting Started (Manual)

### Prerequisites
- [Go](https://go.dev/doc/install) (v1.21 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) installed and in your system PATH

### 1. Setup Backend
```bash
cd backend
# Copy environment file
cp .env.example .env
# Install dependencies
go mod download
# Run in development mode
make dev
```
*The API will be available at `http://localhost:8080`.*

### 2. Setup Frontend
```bash
cd frontend/apipy
# Install dependencies
npm install
# Start development server
npm run dev
```
*The Dashboard will be available at `http://localhost:3000`.*

---

## 📁 Project Structure

```text
api-py/
├── backend/            # Go Gin API
│   ├── cmd/            # Entry points
│   ├── internal/       # Core logic (API, Services, Models)
│   ├── bin/            # Compiled binaries
│   └── pyrunner.db     # SQLite Database
├── frontend/           # Next.js Application
│   └── apipy/          # Main frontend source
├── release/            # Build distributions
└── scripts/            # Repository for uploaded scripts
```

---

## ⚙️ Configuration

The backend is configured via `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Port the API listens on | `8080` |
| `DB_PATH` | Path to SQLite database | `./pyrunner.db` |
| `JWT_SECRET` | Secret for token signing | *Change this!* |
| `PYTHON_PATH` | Command to run Python | `python` |

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

Developed with ❤️ by [Theo](https://github.com/theo)
