#!/usr/bin/env bash
# ==============================================================================
# THa Trash App - PC Desktop & Application Menu Installer
# Installs .desktop launcher onto ~/Desktop and ~/.local/share/applications
# ==============================================================================

set -e

APP_DIR="/home/davidalujones/.gemini/antigravity/scratch/THa-Trash-app"
LAUNCHER="$APP_DIR/launch.sh"
ICON="$APP_DIR/public/logo.svg"
DESKTOP_DIR="/home/davidalujones/Desktop"
APPS_DIR="/home/davidalujones/.local/share/applications"

echo "======================================================"
echo "    INSTALLING THA TRASH APP TO THIS LINUX PC...      "
echo "======================================================"

# 1. Make launch.sh executable
chmod +x "$LAUNCHER"
echo "[OK] Executable permissions set on $LAUNCHER"

# 2. Build production bundle to guarantee instant launch
echo "[STEP 1] Generating fresh production bundle..."
cd "$APP_DIR"
npm run build
echo "[OK] Production bundle built in $APP_DIR/dist"

# 3. Create .desktop file content
DESKTOP_ENTRY="[Desktop Entry]
Version=1.0
Type=Application
Name=THa Trash App
GenericName=Smart Waste Logistics & GeoSocial CleanMap
Comment=Practical in-your-area waste tracking, citizen dump reporting & contractor dispatch
Exec=$LAUNCHER
Icon=$ICON
Terminal=false
Categories=Utility;Geography;Office;System;
Keywords=trash;waste;recycle;map;geosocial;clean;contractor;
StartupNotify=true
"

# 4. Install to Desktop
mkdir -p "$DESKTOP_DIR"
DESKTOP_FILE="$DESKTOP_DIR/THa-Trash-App.desktop"
echo "$DESKTOP_ENTRY" > "$DESKTOP_FILE"
chmod +x "$DESKTOP_FILE"
echo "[OK] Installed Desktop icon: $DESKTOP_FILE"

# 5. Install to User Applications menu
mkdir -p "$APPS_DIR"
APP_MENU_FILE="$APPS_DIR/tha-trash-app.desktop"
echo "$DESKTOP_ENTRY" > "$APP_MENU_FILE"
chmod +x "$APP_MENU_FILE"
echo "[OK] Installed System App Menu entry: $APP_MENU_FILE"

# 6. Update desktop database if available
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR" 2>/dev/null || true
    echo "[OK] Updated Linux desktop database."
fi

echo "======================================================"
echo "      THA TRASH APP IS NOW INSTALLED ON THIS PC!      "
echo "======================================================"
