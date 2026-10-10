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
import shutil
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
VENV_DIR = ROOT / "venv"
REQUIREMENTS = BACKEND / "requirements.txt"
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
    env.setdefault("FRONTEND_URL", "http://localhost:5173")
    return env


def start_frontend(env: dict[str, str]):
    """Install and start the React Vite dev server if npm is available."""
    frontend = ROOT / "frontend"
    if not frontend.exists():
        return None

    npm = shutil.which("npm")
    if not npm:
        print("npm not found. Start the frontend separately with:")
        print("  cd frontend && npm install && npm run dev")
        return None

    if not (frontend / "node_modules").exists():
        print("Installing frontend dependencies...")
        subprocess.check_call([npm, "install"], cwd=str(frontend))

    print("Starting React frontend at http://localhost:5173")
    return subprocess.Popen([npm, "run", "dev"], cwd=str(frontend), env=env)


def start_app() -> None:
    """Run the FastAPI application and React frontend."""
    env = setup_environment()
    frontend_proc = start_frontend(env)
    url = f"http://{HOST}:{PORT}"
    print(f"\nStarting MMONDO API at {url}")
    print("Open the React app at http://localhost:5173")
    print("Press Ctrl+C to stop.\n")

    try:
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
            cwd=str(BACKEND),
            env=env,
        )
    finally:
        if frontend_proc and frontend_proc.poll() is None:
            frontend_proc.terminate()


def main() -> None:
    os.environ.setdefault("BASE_URL", f"http://{HOST}:{PORT}")
    create_venv()
    activate_venv()
    install_dependencies()
    start_app()


if __name__ == "__main__":
    main()
