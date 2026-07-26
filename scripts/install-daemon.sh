#!/bin/bash
set -e

# AutoVPN Privileged Helper Daemon Installer
# This script must be run with sudo/root privileges.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_NAME="helper-daemon"
INSTALL_PATH="/usr/local/bin/autovpn-helper"
SERVICE_PATH="/etc/systemd/system/autovpn-helper.service"

if [ "$1" = "--install-only" ]; then
  if [ "$EUID" -ne 0 ]; then
    echo "Error: installation mode must be run as root." >&2
    exit 1
  fi

  echo "Stopping existing helper service if running to prevent file locking..."
  if systemctl is-active --quiet autovpn-helper; then
    systemctl stop autovpn-helper
  fi

  echo "Installing binary to $INSTALL_PATH..."
  cp "$PROJECT_ROOT/target/release/$BIN_NAME" "$INSTALL_PATH"
  chmod 755 "$INSTALL_PATH"

  echo "Creating systemd service at $SERVICE_PATH..."
  cat <<EOF > "$SERVICE_PATH"
[Unit]
Description=AutoVPN Privileged Helper Daemon
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_PATH
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  echo "Reloading systemd, enabling and starting autovpn-helper service..."
  systemctl daemon-reload
  systemctl enable autovpn-helper
  systemctl restart autovpn-helper

  echo "Checking service status..."
  systemctl status autovpn-helper --no-pager

  echo "--------------------------------------------------------"
  echo "AutoVPN Helper Daemon installed and started successfully!"
  echo "--------------------------------------------------------"
  exit 0
fi

echo "Building helper daemon binary in release mode..."
cd "$PROJECT_ROOT"
cargo build --release --package helper-daemon

echo "Elevating privileges to install daemon..."
sudo "$0" --install-only
