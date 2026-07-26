#!/bin/bash
set -e

# AutoVPN Privileged Helper Daemon Uninstaller

if [ "$EUID" -ne 0 ]; then
  echo "Elevating privileges to uninstall daemon..."
  sudo "$0" "$@"
  exit 0
fi

SERVICE_PATH="/etc/systemd/system/autovpn-helper.service"
INSTALL_PATH="/usr/local/bin/autovpn-helper"
SOCKET_PATH="/var/run/autovpn.sock"

echo "Stopping and disabling autovpn-helper service..."
if systemctl is-active --quiet autovpn-helper; then
  systemctl stop autovpn-helper
fi

if systemctl is-enabled --quiet autovpn-helper 2>/dev/null; then
  systemctl disable autovpn-helper
fi

if [ -f "$SERVICE_PATH" ]; then
  echo "Removing systemd service file..."
  rm "$SERVICE_PATH"
fi

echo "Reloading systemd daemon..."
systemctl daemon-reload

if [ -f "$INSTALL_PATH" ]; then
  echo "Removing helper binary..."
  rm "$INSTALL_PATH"
fi

if [ -S "$SOCKET_PATH" ]; then
  echo "Removing IPC socket..."
  rm "$SOCKET_PATH"
fi

echo "----------------------------------------------------------"
echo "AutoVPN Helper Daemon uninstalled successfully!"
echo "----------------------------------------------------------"
