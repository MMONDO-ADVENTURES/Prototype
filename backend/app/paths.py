from pathlib import Path

_HERE = Path(__file__).resolve()
BACKEND_ROOT = _HERE.parent.parent
REPO_ROOT = BACKEND_ROOT.parent
FRONTEND_DIR = REPO_ROOT / "frontend"
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = BACKEND_ROOT / "frontend"

FRONTEND_DIST = FRONTEND_DIR / "dist"

_STATIC_CANDIDATES = (
    FRONTEND_DIR / "static",
    FRONTEND_DIST / "static",
    BACKEND_ROOT / "static",
)
STATIC_DIR = next((path for path in _STATIC_CANDIDATES if path.exists()), FRONTEND_DIR / "static")
STATIC_DIR.mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "uploads" / "profile_pictures").mkdir(parents=True, exist_ok=True)


def static_file(*parts: str) -> Path:
    path = STATIC_DIR.joinpath(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def disk_from_static_url(url: str) -> Path:
    relative = url.lstrip("/").removeprefix("static/")
    return STATIC_DIR / relative
