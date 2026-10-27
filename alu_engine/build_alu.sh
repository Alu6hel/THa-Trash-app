#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALU_DIR="/home/davidalujones/.gemini/antigravity/scratch/alu-language"
ALU_CXX="$ALU_DIR/cpp_frontend/build/alu_cxx"

mkdir -p "$SCRIPT_DIR/bin"

if [ ! -f "$ALU_CXX" ]; then
    echo "[ERROR] Alu compiler alu_cxx not found at $ALU_CXX"
    exit 1
fi

echo "[INFO] Compiling Alu Waste Management Engine..."
cd "$SCRIPT_DIR"

# Copy standard library files if needed or run with stdPath
"$ALU_CXX" bin_optimizer.alu --std-path "$ALU_DIR"

if [ -f "bin_optimizer.exe" ]; then
    mv bin_optimizer.exe bin/tha_trash_engine
    chmod +x bin/tha_trash_engine
    ln -sf tha_trash_engine bin/tha_trash_engine.exe 2>/dev/null || true
    echo "[SUCCESS] Built native Alu engine binary at: $SCRIPT_DIR/bin/tha_trash_engine"
else
    echo "[ERROR] Compilation finished but bin_optimizer.exe was not produced."
    exit 1
fi
