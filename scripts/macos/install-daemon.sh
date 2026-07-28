#!/bin/bash
set -e

# AutoVPN macOS Helper Daemon Installer
# Needs to run with root privileges (sudo)

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON_BIN="$SCRIPT_DIR/helper-daemon"
PLIST_PATH="/Library/LaunchDaemons/com.haiphamngoc-dev.autovpn-helper.plist"
INSTALL_PATH="/usr/local/bin/autovpn-helper"

echo "Stopping existing launchd service if loaded..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true

echo "Installing binary to $INSTALL_PATH..."
mkdir -p /usr/local/bin
cp "$DAEMON_BIN" "$INSTALL_PATH"
chmod 755 "$INSTALL_PATH"

echo "Installing launchd plist to $PLIST_PATH..."
cp "$SCRIPT_DIR/autovpn-helper.plist" "$PLIST_PATH"
chmod 644 "$PLIST_PATH"
chown root:wheel "$PLIST_PATH"

echo "Loading and starting launchd service..."
launchctl load -w "$PLIST_PATH"

echo "macOS helper daemon service started successfully."
