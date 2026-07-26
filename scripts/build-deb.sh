#!/bin/bash
set -e

# AutoVPN .deb Build Script
# Builds the Tauri app, compiles the helper daemon, then repackages
# the .deb to include the daemon binary, systemd service, and
# maintainer scripts (postinst/prerm/postrm).

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Step 1: Building helper-daemon in release mode..."
cargo build --release --package helper-daemon

echo ""
echo "==> Step 2: Running Tauri build (frontend + desktop app)..."
# The signing key error is expected in dev; we still get the .deb
pnpm --filter autovpn-desktop tauri build 2>&1 || true

echo ""
echo "==> Step 3: Locating generated .deb..."
DEB_PATH=$(find target/release/bundle/deb -name "*.deb" 2>/dev/null | head -1)
if [ -z "$DEB_PATH" ]; then
  echo "ERROR: No .deb file found in target/release/bundle/deb/"
  exit 1
fi
echo "    Found: $DEB_PATH"

echo ""
echo "==> Step 4: Repackaging .deb with daemon + maintainer scripts..."
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

# Extract the existing .deb
dpkg-deb -R "$DEB_PATH" "$WORK_DIR"

# --- Inject daemon binary ---
mkdir -p "$WORK_DIR/usr/local/bin"
cp target/release/helper-daemon "$WORK_DIR/usr/local/bin/autovpn-helper"
chmod 755 "$WORK_DIR/usr/local/bin/autovpn-helper"

# --- Inject systemd service file ---
mkdir -p "$WORK_DIR/usr/share/autovpn"
cp scripts/deb/autovpn-helper.service "$WORK_DIR/usr/share/autovpn/"

# --- Inject maintainer scripts ---
cp scripts/deb/postinst "$WORK_DIR/DEBIAN/"
cp scripts/deb/prerm "$WORK_DIR/DEBIAN/"
cp scripts/deb/postrm "$WORK_DIR/DEBIAN/"
chmod 755 "$WORK_DIR/DEBIAN/postinst" "$WORK_DIR/DEBIAN/prerm" "$WORK_DIR/DEBIAN/postrm"

# --- Add openvpn to Depends ---
if grep -q "^Depends:" "$WORK_DIR/DEBIAN/control"; then
  # Only add if not already present
  if ! grep -q "openvpn" "$WORK_DIR/DEBIAN/control"; then
    sed -i 's/^Depends: /Depends: openvpn, /' "$WORK_DIR/DEBIAN/control"
  fi
else
  echo "Depends: openvpn" >> "$WORK_DIR/DEBIAN/control"
fi

# --- Repack ---
dpkg-deb -b "$WORK_DIR" "$DEB_PATH"

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
