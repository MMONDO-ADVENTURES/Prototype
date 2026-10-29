import os


def _strip(url: str) -> str:
    return (url or "").rstrip("/")


def render_external_url() -> str:
    return _strip(os.getenv("RENDER_EXTERNAL_URL", ""))


def frontend_url() -> str:
    return _strip(os.getenv("FRONTEND_URL")) or render_external_url() or "http://localhost:5173"


def base_url() -> str:
    return _strip(os.getenv("BASE_URL")) or render_external_url() or "http://localhost:8000"


def payments_enabled() -> bool:
    """Online checkout. Off unless PAYMENTS_ENABLED is true/1/yes/on.

    To restore the previous payment workflow: set PAYMENTS_ENABLED=true
    in .env (and on Render), then restart the API. Book This Tour will
    go to /payment again; Stripe and PayPal endpoints stay in the code.
    """
    return os.getenv("PAYMENTS_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}


def enquiry_notify_email() -> str:
    return (os.getenv("ENQUIRY_NOTIFY_EMAIL") or os.getenv("SMTP_USER") or "").strip()


def google_sheets_webhook_url() -> str:
    return (os.getenv("GOOGLE_SHEETS_WEBHOOK_URL") or "").strip()


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
