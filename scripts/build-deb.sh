#!/bin/bash
set -e

# AutoVPN .deb Build Script
# Builds the Tauri app and natively packages the helper daemon,
# systemd service, and maintainer scripts.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Step 1: Running Tauri build (frontend + desktop app + helper daemon)..."
# The signing key error is bypassed using --no-signing for local builds
pnpm --filter autovpn-desktop tauri build --no-sign 2>&1

echo ""
echo "==> Step 2: Locating generated .deb..."
DEB_PATH=$(find target/release/bundle/deb -name "*.deb" 2>/dev/null | head -1)
if [ -z "$DEB_PATH" ]; then
  echo "ERROR: No .deb file found in target/release/bundle/deb/"
  exit 1
fi
echo "    Found: $DEB_PATH"

echo ""
echo "============================================"
echo "  ✅ .deb ready: $DEB_PATH"
echo "============================================"
echo ""
echo "Install with:"
echo "  sudo apt install ./$DEB_PATH"
echo ""
echo "Or:"
echo "  sudo dpkg -i $DEB_PATH"
