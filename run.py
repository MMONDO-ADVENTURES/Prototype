"""
Simple launcher for the MMONDO app.

Usage:
    python run.py

This script will:
  1. Create the venv folder if it does not exist
  2. Switch to the virtual environment (activate it)
  3. Install dependencies from requirements.txt
  4. Start the FastAPI app with uvicorn
"""

import os
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
VENV_DIR = ROOT / "venv"
REQUIREMENTS = ROOT / "requirements.txt"
HOST = "localhost"
PORT = 8000


def _find_system_python() -> str:
    """Find a working Python interpreter on Windows even in Git Bash."""
    if Path(sys.executable).exists():
        return sys.executable

    candidates = []
    if sys.platform == "win32":
        import shutil
        for name in ("python", "python3", "py"):
            found = shutil.which(name)
            if found:
                candidates.append(found)
        local = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python"
        if local.exists():
            for d in sorted(local.iterdir(), reverse=True):
                p = d / "python.exe"
                if p.exists():
                    candidates.append(str(p))
    if candidates:
        return candidates[0]
    return sys.executable


def venv_python() -> Path:
    """Return the Python executable inside the venv folder."""
    win_path = VENV_DIR / "Scripts" / "python.exe"
    if win_path.exists():
        return win_path
    unix_path = VENV_DIR / "bin" / "python"
    if unix_path.exists():
        return unix_path
    return win_path if sys.platform == "win32" else unix_path


def create_venv() -> None:
    """Create the venv folder if it is missing."""
    if VENV_DIR.exists():
        return

    python = _find_system_python()
    print(f"Creating virtual environment in ./venv (using {python}) ...")
    subprocess.check_call([python, "-m", "venv", str(VENV_DIR)])


def activate_venv() -> None:
    """
    Activate the venv by re-running this script with the venv Python.
    This is the standard way to use a venv from a Python script.
    """
    python_in_venv = venv_python()

    if not python_in_venv.exists():
        raise FileNotFoundError(f"Virtual environment not found at {VENV_DIR}")

    if Path(sys.executable).resolve() != python_in_venv.resolve():
        print("Activating virtual environment...")
        raise SystemExit(
            subprocess.call([str(python_in_venv), __file__, *sys.argv[1:]])
        )


def install_dependencies() -> None:
    """Install packages listed in requirements.txt."""
    if not REQUIREMENTS.exists():
        print("No requirements.txt found, skipping dependency install.")
        return

    print("Installing dependencies...")
    subprocess.check_call(
        [str(venv_python()), "-m", "pip", "install", "-r", str(REQUIREMENTS)]
    )


def setup_environment() -> dict[str, str]:
    """Set default environment variables for local development."""
    env = os.environ.copy()
    env.setdefault("BASE_URL", f"http://{HOST}:{PORT}")
    return env


def start_app() -> None:
    """Run the FastAPI application."""
    url = f"http://{HOST}:{PORT}"
    print(f"\nStarting MMONDO at {url}")
    print("Press Ctrl+C to stop.\n")

    subprocess.check_call(
        [
            str(venv_python()),
            "-m",
            "uvicorn",
            "app.main:app",
            "--reload",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ],
        cwd=str(ROOT),
        env=setup_environment(),
    )


def main() -> None:
    os.environ.setdefault("BASE_URL", f"http://{HOST}:{PORT}")
    create_venv()
    activate_venv()
    install_dependencies()
    start_app()


if __name__ == "__main__":
    main()
