#!/bin/bash

# ==========================================
# apiPy - Installation & Update Script
# Support: Debian / Ubuntu (x64)
# ==========================================

set -e

APP_NAME="apiPy"
INSTALL_DIR="/opt/$APP_NAME"
REPO="TheoLanles/apiPy"
SERVICE_FILE="/etc/systemd/system/apipy.service"
BIN_PATH="$INSTALL_DIR/apiPy"

# Ensure we are running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run as root (use sudo)"
  exit 1
fi

echo "=============================="
echo " INSTALL / UPDATE $APP_NAME"
echo "=============================="

echo "=== INSTALL DEPENDENCIES ==="
apt update -y
apt install -y curl jq wget python3 python3-pip python3-venv

echo "=== CREATE INSTALL DIR ==="
mkdir -p "$INSTALL_DIR"

echo "=== GET LATEST RELEASE ==="
# Fetch release data
RELEASE_DATA=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")

# Filter for assets containing "apiPy" (case-insensitive)
DOWNLOAD_URL=$(echo "$RELEASE_DATA" | jq -r '.assets[] | select(.name | ascii_downcase | contains("apipy")) | .browser_download_url' | head -n 1)

if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" == "null" ]; then
  echo "❌ ERREUR: Aucun binaire 'apiPy' trouvé dans la dernière release de $REPO."
  echo "Assets trouvés :"
  echo "$RELEASE_DATA" | jq -r '.assets[].name' || echo "Aucun asset trouvé."
  echo ""
  echo "Assurez-vous d'avoir créé une release sur GitHub et d'y avoir uploadé le fichier 'pyrunner-linux'."
  exit 1
fi

echo "Download URL: $DOWNLOAD_URL"

echo "=== CHECK IF ALREADY INSTALLED ==="
if [ -f "$BIN_PATH" ]; then
    echo "🔄 UPDATE MODE"
else
    echo "🆕 INSTALL MODE"
fi

echo "=== DOWNLOAD BINARY ==="
wget -O "$BIN_PATH.new" "$DOWNLOAD_URL"
chmod +x "$BIN_PATH.new"

echo "=== REPLACE BINARY ==="
# Stop service if exists to prevent "text file busy"
if systemctl is-active --quiet apipy; then
    systemctl stop apipy
fi

mv "$BIN_PATH.new" "$BIN_PATH"
chmod +x "$BIN_PATH"

echo "=== CREATE SYSTEMD SERVICE ==="
if [ ! -f "$SERVICE_FILE" ]; then
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=apiPy Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$BIN_PATH
Restart=always
RestartSec=3
User=root
Group=root
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF
fi

echo "=== SYSTEMD RELOAD ==="
systemctl daemon-reload
systemctl enable apipy

echo "=== RESTART SERVICE ==="
systemctl restart apipy

echo "=============================="
echo " INSTALLATION DONE"
echo "=============================="

systemctl status apipy --no-pager
