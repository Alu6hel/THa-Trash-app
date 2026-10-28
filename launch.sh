#!/usr/bin/env bash
# ==============================================================================
# THa Trash App - Native Android & Desktop Launcher
# Launches the installed Android APK on this PC (via ADB / ChromeOS Android Subsystem)
# with intelligent fallback to local web preview.
# ==============================================================================

set -e

APP_DIR="/home/davidalujones/.gemini/antigravity/scratch/THa-Trash-app"
cd "$APP_DIR"
PACKAGE_NAME="com.alu6hel.thatrashapp"
MAIN_ACTIVITY="com.alu6hel.thatrashapp.MainActivity"
APK_PATH="$APP_DIR/release/THa-Trash-App.apk"

echo "======================================================"
echo "    LAUNCHING THA TRASH APP (STRICTLY ANDROID)        "
echo "======================================================"

# 1. Attempt ADB launch to native Android subsystem
if command -v adb >/dev/null 2>&1; then
    # Ensure ADB is connected to ChromeOS Android container
    adb connect 100.115.92.2:5555 >/dev/null 2>&1 || true

    # Check if package is installed
    if adb -s 100.115.92.2:5555 shell pm list packages 2>/dev/null | grep -q "$PACKAGE_NAME"; then
        echo "[LAUNCHER] Found installed Android APK: $PACKAGE_NAME"
        echo "[LAUNCHER] Launching native Android application window..."
        adb -s 100.115.92.2:5555 shell am start -n "${PACKAGE_NAME}/.MainActivity" >/dev/null 2>&1
        echo "[SUCCESS] Native Android application window is active!"
        exit 0
    elif [ -f "$APK_PATH" ]; then
        echo "[LAUNCHER] Installing APK to Android subsystem..."
        adb -s 100.115.92.2:5555 install -r "$APK_PATH" >/dev/null 2>&1
        echo "[LAUNCHER] Launching freshly installed Android APK..."
        adb -s 100.115.92.2:5555 shell am start -n "${PACKAGE_NAME}/.MainActivity" >/dev/null 2>&1
        echo "[SUCCESS] Native Android application installed and launched!"
        exit 0
    fi
fi

# Fallback to local server preview if ADB is offline
PORT=4173
URL="http://localhost:${PORT}"

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "[LAUNCHER] Building web assets with npm run build..."
    npm run build
fi

if ! curl -s --head "$URL" >/dev/null 2>&1; then
    echo "[LAUNCHER] Starting local preview server on port ${PORT}..."
    setsid nohup ./node_modules/.bin/vite preview --port ${PORT} --host 0.0.0.0 </dev/null >/tmp/tha_trash_app_preview.log 2>&1 &
    sleep 1
fi

if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
fi

echo "[LAUNCHER] THa Trash App launched successfully."

