#!/usr/bin/env bash
# ==============================================================================
# THa Trash App - Native Linux Desktop PC Launcher
# Launches the PWA / web application and opens it in the default desktop browser
# ==============================================================================

set -e

APP_DIR="/home/davidalujones/.gemini/antigravity/scratch/THa-Trash-app"
cd "$APP_DIR"

PORT=4173
URL="http://localhost:${PORT}"

# Ensure production build exists
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "[LAUNCHER] Production bundle not found. Building with npm run build..."
    npm run build
fi

# Check if server is already running on port 4173
if ! curl -s --head "$URL" >/dev/null 2>&1; then
    echo "[LAUNCHER] Starting local preview server on port ${PORT}..."
    npx vite preview --port ${PORT} --host 127.0.0.1 >/tmp/tha_trash_app_preview.log 2>&1 &
    SERVER_PID=$!
    
    # Wait up to 5 seconds for server to bind
    for i in {1..10}; do
        if curl -s --head "$URL" >/dev/null 2>&1; then
            echo "[LAUNCHER] Server is active (PID: ${SERVER_PID})."
            break
        fi
        sleep 0.5
    done
else
    echo "[LAUNCHER] Preview server is already running on ${URL}."
fi

# Open in default browser or Chromium/Chrome app mode
if command -v xdg-open >/dev/null 2>&1; then
    echo "[LAUNCHER] Opening THa Trash App at ${URL}..."
    xdg-open "$URL" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome --app="$URL" >/dev/null 2>&1 &
elif command -v firefox >/dev/null 2>&1; then
    firefox "$URL" >/dev/null 2>&1 &
else
    echo "[LAUNCHER] Please open your browser to: ${URL}"
fi

echo "[LAUNCHER] THa Trash App launched successfully."
