#!/usr/bin/env bash
# ==============================================================================
# THa Trash App - Native Android APK Installer
# Builds native Android APK with Gradle, installs it onto this PC via ADB,
# and configures Desktop / System App launcher shortcuts.
# ==============================================================================

set -e

APP_DIR="/home/davidalujones/.gemini/antigravity/scratch/THa-Trash-app"
LAUNCHER="$APP_DIR/launch.sh"
ICON="$APP_DIR/public/logo.svg"
DESKTOP_DIR="/home/davidalujones/Desktop"
APPS_DIR="/home/davidalujones/.local/share/applications"
RELEASE_DIR="$APP_DIR/release"
APK_OUTPUT="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
APK_TARGET="$RELEASE_DIR/THa-Trash-App.apk"
PACKAGE_NAME="com.alu6hel.thatrashapp"

echo "======================================================"
echo "    INSTALLING THA TRASH APP AS NATIVE ANDROID APK    "
echo "======================================================"

cd "$APP_DIR"

# 1. Build production web bundle
echo "[STEP 1/5] Building web assets with Vite..."
npm run build

# 2. Sync native Android project
echo "[STEP 2/5] Syncing Capacitor native Android platform..."
npx cap sync android

# 3. Compile Android APK with Gradle
echo "[STEP 3/5] Compiling native Android APK via Gradle..."
cd android
./gradlew assembleDebug
cd "$APP_DIR"

mkdir -p "$RELEASE_DIR"
cp "$APK_OUTPUT" "$APK_TARGET"
echo "[OK] Generated native Android APK: $APK_TARGET ($(du -h "$APK_TARGET" | cut -f1))"

# 4. Install APK directly onto PC's Android Subsystem via ADB
echo "[STEP 4/5] Installing APK directly onto this PC's Android subsystem via ADB..."
if command -v adb >/dev/null 2>&1; then
    adb connect 100.115.92.2:5555 >/dev/null 2>&1 || true
    if adb -s 100.115.92.2:5555 install -r "$APK_TARGET"; then
        echo "[SUCCESS] APK successfully installed onto Android device!"
    else
        echo "[WARNING] ADB install failed or device not responding; APK remains ready at $APK_TARGET"
    fi
else
    echo "[WARNING] adb not found; APK compiled at $APK_TARGET"
fi

# 5. Configure Desktop & Application Menu shortcuts
echo "[STEP 5/5] Configuring Linux Desktop & App Menu shortcuts..."
chmod +x "$LAUNCHER"

DESKTOP_ENTRY="[Desktop Entry]
Version=1.0
Type=Application
Name=THa Trash App
GenericName=Strictly Android Smart Waste Logistics & GeoSocial CleanMap
Comment=Native Android APK for in-your-area waste tracking & citizen dump cleanup
Exec=$LAUNCHER
Icon=$ICON
Terminal=false
Categories=Utility;Geography;Office;System;
Keywords=trash;waste;recycle;map;geosocial;clean;contractor;apk;android;
StartupNotify=true
"

mkdir -p "$DESKTOP_DIR"
echo "$DESKTOP_ENTRY" > "$DESKTOP_DIR/THa-Trash-App.desktop"
chmod +x "$DESKTOP_DIR/THa-Trash-App.desktop"

mkdir -p "$APPS_DIR"
echo "$DESKTOP_ENTRY" > "$APPS_DIR/tha-trash-app.desktop"
chmod +x "$APPS_DIR/tha-trash-app.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR" 2>/dev/null || true
fi

echo "======================================================"
echo "  THA TRASH APP NATIVE ANDROID INSTALLATION COMPLETE! "
echo "  Package: $PACKAGE_NAME                              "
echo "  APK:     $APK_TARGET                                "
echo "======================================================"

