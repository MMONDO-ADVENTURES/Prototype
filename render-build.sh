#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

if ! command -v npm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

cd frontend
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build
