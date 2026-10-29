from datetime import datetime, timezone
from html import escape

import httpx

from app.config import enquiry_notify_email, google_sheets_webhook_url
from app.utils import send_email


def _safe(value) -> str:
    return escape(str(value or "").strip())


def append_google_sheet(row: dict) -> bool:
    url = google_sheets_webhook_url()
    if not url:
        print("GOOGLE_SHEETS_WEBHOOK_URL is not set; skipping Google Sheet append")
        return False
    try:
        with httpx.Client(timeout=20, follow_redirects=True) as client:
            response = client.post(url, json=row)
            response.raise_for_status()
        return True
    except Exception as exc:
        print(f"Google Sheet append failed: {exc}")
        return False


def notify_tour_inquiry(
    *,
    name: str,
    email: str,
    phone: str,
    tour_title: str,
    preferred_date: str,
    people: int,
    interest_level: str,
    message: str = "",
    source: str = "tour page",
) -> dict:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sheet_saved = append_google_sheet(
        {
            "timestamp": timestamp,
            "name": name,
            "email": email,
            "phone": phone,
            "tour": tour_title,
            "preferred_date": preferred_date,
            "people": people,
            "interest_level": interest_level,
            "message": message or "",
            "source": source,
        }
    )

    owner = enquiry_notify_email()
    details = f"""
        <ul>
            <li><strong>Name:</strong> {_safe(name)}</li>
            <li><strong>Email:</strong> {_safe(email)}</li>
            <li><strong>Phone:</strong> {_safe(phone) or "Not provided"}</li>
            <li><strong>Tour:</strong> {_safe(tour_title)}</li>
            <li><strong>Preferred date:</strong> {_safe(preferred_date)}</li>
            <li><strong>Number of people:</strong> {int(people)}</li>
            <li><strong>Interest level:</strong> {_safe(interest_level)}</li>
        </ul>
    """
    note = f"<p><strong>Message:</strong> {_safe(message)}</p>" if message else ""
    email_sent = False
    if owner:
        try:
            send_email(
                owner,
                f"Tour inquiry: {tour_title}",
                f"""
                <html><body>
                    <p>A traveller sent an expression of interest. This is not a paid booking.</p>
                    {details}
                    {note}
                </body></html>
                """,
                is_html=True,
            )
            email_sent = True
        except Exception as exc:
            print(f"Owner inquiry email failed: {exc}")

    return {"sheet_saved": sheet_saved, "email_sent": email_sent}
