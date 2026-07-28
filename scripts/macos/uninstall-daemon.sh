#!/bin/bash
set -e

# AutoVPN macOS Helper Daemon Uninstaller
# Needs to run with root privileges (sudo)

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

PLIST_PATH="/Library/LaunchDaemons/com.haiphamngoc-dev.autovpn-helper.plist"
INSTALL_PATH="/usr/local/bin/autovpn-helper"

echo "Stopping and unloading launchd service..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true

echo "Removing binary and plist files..."
rm -f "$INSTALL_PATH"
rm -f "$PLIST_PATH"
rm -f "/usr/local/bin/openvpn-autovpn"
rm -f "/var/run/autovpn.sock"

echo "macOS helper daemon service uninstalled successfully."
