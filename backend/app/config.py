import os


def _strip(url: str) -> str:
    return (url or "").rstrip("/")


def render_external_url() -> str:
    return _strip(os.getenv("RENDER_EXTERNAL_URL", ""))


def frontend_url() -> str:
    return _strip(os.getenv("FRONTEND_URL")) or render_external_url() or "http://localhost:5173"


def base_url() -> str:
    return _strip(os.getenv("BASE_URL")) or render_external_url() or "http://localhost:8000"


def cors_origins() -> list[str]:
    origins = {
        frontend_url(),
        base_url(),
        render_external_url(),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    }
    return [origin for origin in origins if origin]
