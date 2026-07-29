#!/usr/bin/env bash
# Mmondo Adventures launcher — works in Git Bash, WSL, and Linux/macOS
# Usage: bash start.sh
cd "$(dirname "$0")" || exit 1

find_python() {
    # 1. Existing venv
    [[ -f "venv/Scripts/python.exe" ]] && echo "venv/Scripts/python.exe" && return
    [[ -f "venv/bin/python" ]]         && echo "venv/bin/python"         && return

    # 2. System PATH
    for cmd in py python3 python; do
        command -v "$cmd" &>/dev/null && echo "$cmd" && return
    done

    # 3. Common Windows install dirs (Git Bash often can't see PATH)
    for p in \
        "$LOCALAPPDATA/Programs/Python"/Python3*/python.exe \
        "$HOME/AppData/Local/Programs/Python"/Python3*/python.exe \
        /c/Python3*/python.exe; do
        [[ -f "$p" ]] && echo "$p" && return
    done

    return 1
}

PYTHON=$(find_python)
if [[ -z "$PYTHON" ]]; then
    echo "ERROR: Python not found. Install Python 3, then retry."
    exit 1
fi
echo "Using: $PYTHON"

# Create venv if missing
if [[ ! -d "venv" ]]; then
    echo "Creating virtual environment..."
    "$PYTHON" -m venv venv || { echo "Failed to create venv"; exit 1; }
    # Resolve venv python
    [[ -f "venv/Scripts/python.exe" ]] && PYTHON="venv/Scripts/python.exe" || PYTHON="venv/bin/python"
    echo "Installing dependencies..."
    "$PYTHON" -m pip install -r requirements.txt -q
else
    [[ -f "venv/Scripts/python.exe" ]] && PYTHON="venv/Scripts/python.exe"
    [[ -f "venv/bin/python" ]]         && PYTHON="venv/bin/python"
fi

echo ""
echo "Starting MMONDO at http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""
exec "$PYTHON" -m uvicorn app.main:app --reload --host localhost --port 8000
