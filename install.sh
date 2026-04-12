#!/bin/bash

set -e

APP_NAME="apiPy"
INSTALL_DIR="/opt/$APP_NAME"
REPO="TheoLanles/apiPy"
SERVICE_FILE="/etc/systemd/system/apipy.service"
BIN_PATH="$INSTALL_DIR/apiPy"

echo "=============================="
echo " INSTALL / UPDATE $APP_NAME"
echo "=============================="

echo "=== INSTALL DEPENDENCIES ==="
apt update -y
apt install -y curl jq wget psmisc python3 python3-pip python3-venv

echo "=== CREATE INSTALL DIR ==="
mkdir -p "$INSTALL_DIR"

echo "=== GET LATEST RELEASE ==="

DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" \
| jq -r '.assets[] | select(.name | test("apiPy")) | .browser_download_url' \
| head -n 1)

if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" == "null" ]; then
  echo "❌ ERREUR: aucun binaire apiPy trouvé"
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
file "$BIN_PATH.new" || true

echo "=== REPLACE BINARY ==="
mv "$BIN_PATH.new" "$BIN_PATH"
chmod +x "$BIN_PATH"

echo "=== CREATE SYSTEMD SERVICE (IF NOT EXISTS) ==="

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
systemctl daemon-reexec
systemctl daemon-reload
systemctl enable apipy

echo "=== RESTART SERVICE ==="
systemctl restart apipy

echo "=============================="
echo " DONE"
echo "=============================="

systemctl status apipy --no-pager
