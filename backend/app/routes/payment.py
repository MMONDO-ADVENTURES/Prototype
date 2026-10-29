import os
from datetime import datetime

import httpx
import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload

from app.config import frontend_url, payments_enabled
from app.database import get_db
from app.models import Booking, Tour, User
from app.serializers import booking_dict, companions_json, parse_companions, tour_dict
from app.utils import get_current_user, send_email

load_dotenv()

router = APIRouter(prefix="/api/payment", tags=["payment"])
CHECKOUT_PAUSED = (
    "Online checkout is paused. Register your interest on the tour page — this is not a booking."
)


def assert_checkout_enabled():
    if not payments_enabled():
        raise HTTPException(status_code=403, detail=CHECKOUT_PAUSED)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = frontend_url()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")


def resolve_base_url(request: Request) -> str:
    request_origin = str(request.base_url).rstrip("/")
    if any(host in request_origin for host in ("localhost", "127.0.0.1", "0.0.0.0")):
        return request_origin
    return (os.getenv("BASE_URL") or request_origin).rstrip("/")


def parse_booking_date(raw) -> datetime:
    return datetime.strptime(str(raw or "")[:10], "%Y-%m-%d")


def paypal_configured() -> bool:
    return bool(PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET)


def paypal_api_base() -> str:
    if str(PAYPAL_MODE or "sandbox").lower() == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def paypal_custom_id(user: User, tour: Tour, booking_data: dict, total_price: float) -> str:
    return "|".join(
        [
            f"u:{user.id}",
            f"t:{tour.id}",
            f"d:{booking_data.get('tour_date', '')}",
            f"a:{booking_data.get('adults', 0)}",
            f"k:{booking_data.get('kids', 0)}",
            f"p:{float(total_price):.2f}",
        ]
    )[:127]


def parse_paypal_custom_id(custom_id: str) -> dict:
    mapping = {"u": "user_id", "t": "tour_id", "d": "tour_date", "a": "adults", "k": "kids", "p": "total_price"}
    meta = {}
    for part in str(custom_id or "").split("|"):
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        field = mapping.get(key)
        if field:
            meta[field] = value
    return meta


def apply_companion_updates(request: Request, payload=None) -> dict:
    booking_data = request.session.get("booking") or {}
    if not payload:
        return booking_data
    if "companions" in payload or "add_companions" in payload:
        add_companions = bool(payload.get("add_companions", booking_data.get("add_companions")))
        booking_data["add_companions"] = add_companions
        booking_data["companions"] = parse_companions(payload.get("companions")) if add_companions else []
        request.session["booking"] = booking_data
    return booking_data


async def paypal_access_token() -> str:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{paypal_api_base()}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Could not authenticate with PayPal")
    token = (response.json() or {}).get("access_token")
    if not token:
        raise HTTPException(status_code=502, detail="PayPal did not return an access token")
    return token


async def paypal_order_request(method: str, path: str, token: str, json_body=None) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.request(
            method,
            f"{paypal_api_base()}{path}",
            json=json_body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
    data = response.json() if response.content else {}
    if response.status_code >= 400:
        message = data.get("message") or data.get("error_description") or "PayPal request failed"
        raise HTTPException(status_code=502, detail=message)
    return data


async def paypal_capture_order(order_id: str) -> dict:
    token = await paypal_access_token()
    try:
        return await paypal_order_request("POST", f"/v2/checkout/orders/{order_id}/capture", token, json_body={})
    except HTTPException:
        order = await paypal_order_request("GET", f"/v2/checkout/orders/{order_id}", token)
        if str(order.get("status") or "").upper() == "COMPLETED":
            return order
        raise


def booking_amount_cents(total_price) -> int:
    try:
        cents = int(round(float(total_price) * 100))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid booking amount") from exc
    if cents < 50:
        raise HTTPException(status_code=400, detail="Amount must be at least $0.50")
    return cents


def send_booking_email(user: User, booking: Booking, payment_ref: str = "") -> None:
    special_reqs = booking.special_requirements
    special_reqs_text = (
        f"<p><strong>Special Requirements:</strong> {special_reqs}</p>" if special_reqs else ""
    )
    companions = parse_companions(getattr(booking, "companions", None))
    companions_text = ""
    if companions:
        rows = []
        for item in companions:
            extra = f" — {item['details']}" if item.get("details") else ""
            rows.append(f"<li>{item['full_name'] or 'Traveller'} ({item['role']}){extra}</li>")
        companions_text = f"<p><strong>Other travellers:</strong></p><ul>{''.join(rows)}</ul>"
    payment_line = f"<li><strong>Payment ID:</strong> {payment_ref}</li>" if payment_ref else ""
    try:
        send_email(
            user.email,
            "Booking Confirmation",
            f"""
            <html>
            <body>
                <p>Dear {user.full_name},</p>
                <p>Thank you for booking with Mmondo Adventures.</p>
                <ul>
                    <li><strong>Tour:</strong> {booking.tour.title if booking.tour else 'Your tour'}</li>
                    <li><strong>Date:</strong> {booking.tour_date}</li>
                    <li><strong>Adults:</strong> {booking.adults}</li>
                    <li><strong>Children:</strong> {booking.kids}</li>
                    <li><strong>Total:</strong> ${booking.total_price}</li>
                    {payment_line}
                </ul>
                {special_reqs_text}
                {companions_text}
            </body>
            </html>
            """,
            is_html=True,
        )
    except Exception as exc:
        print(f"Booking email error: {exc}")


def booking_metadata(request: Request, user: User, tour: Tour, booking_data: dict, total_price: float) -> dict:
    return {
        "user_id": str(user.id),
        "tour_id": str(tour.id),
        "adults": str(booking_data.get("adults", 0)),
        "kids": str(booking_data.get("kids", 0)),
        "total_price": f"{total_price:.2f}",
        "tour_date": str(booking_data.get("tour_date", "")),
    }


def create_booking_from_payment(
    request: Request,
    db: Session,
    user: User,
    payment_ref: str,
    meta: dict,
    payment_method: str = "stripe",
) -> Booking:
    payment_ref = str(payment_ref)[:100]
    existing = (
        db.query(Booking)
        .filter(Booking.payment_id == payment_ref, Booking.user_id == user.id)
        .first()
    )
    if existing:
        request.session.pop("booking", None)
        return existing

    booking_data = request.session.get("booking", {}) or {}
    tour_id = int(meta.get("tour_id") or booking_data.get("tour_id"))
    adults = int(meta.get("adults") or booking_data.get("adults") or 1)
    kids = int(meta.get("kids") or booking_data.get("kids") or 0)
    tour_date_raw = meta.get("tour_date") or booking_data.get("tour_date")
    total_price = float(meta.get("total_price") or booking_data.get("total_price") or 0)
    new_booking = Booking(
        user_id=user.id,
        tour_id=tour_id,
        adults=adults,
        kids=kids,
        tour_date=parse_booking_date(tour_date_raw),
        total_price=total_price,
        is_private=False,
        donation=float(booking_data.get("donation", 0) or 0),
        payment_method=payment_method,
        payment_id=payment_ref,
        special_requirements=booking_data.get("special_requirements"),
        companions=companions_json(booking_data.get("companions") if booking_data.get("add_companions") else []),
        payment_status="completed",
        status="confirmed",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    send_booking_email(user, new_booking, payment_ref)
    request.session.pop("booking", None)
    return new_booking


@router.get("/config")
async def payment_config():
    enabled = payments_enabled()
    return {
        "payments_enabled": enabled,
        "paypal_client_id": PAYPAL_CLIENT_ID,
        "stripe_public_key": os.getenv("STRIPE_PUBLIC_KEY"),
        "paypal_env": PAYPAL_MODE or "sandbox",
        "stripe_configured": bool(stripe.api_key),
        "paypal_configured": paypal_configured(),
    }


@router.post("/create-intent")
async def create_payment_intent(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")
    assert_checkout_enabled()
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    booking_data = request.session.get("booking")
    if not booking_data:
        raise HTTPException(status_code=400, detail="Booking session expired. Please start again from the tour page.")

    tour = db.query(Tour).filter(Tour.id == booking_data["tour_id"]).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    try:
        total_price = float(booking_data["total_price"])
        unit_amount = booking_amount_cents(total_price)
        intent = stripe.PaymentIntent.create(
            amount=unit_amount,
            currency="usd",
            payment_method_types=["card"],
            receipt_email=user.email,
            description=(tour.title or "Tour booking")[:120],
            metadata=booking_metadata(request, user, tour, booking_data, total_price),
        )
        return {"clientSecret": intent.client_secret, "paymentIntentId": intent.id}
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=getattr(e, "user_message", None) or str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {e}") from e


@router.post("/confirm-card")
async def confirm_card_payment(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")
    assert_checkout_enabled()

    payload = await request.json()
    payment_intent_id = str(payload.get("payment_intent_id") or "").strip()
    if not payment_intent_id:
        raise HTTPException(status_code=400, detail="Missing payment intent")

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail=f"Payment not completed (status: {intent.status})")
        meta_user = (intent.metadata or {}).get("user_id")
        if meta_user and str(meta_user) != str(user.id):
            raise HTTPException(status_code=403, detail="Payment does not belong to this account")

        create_booking_from_payment(
            request,
            db,
            user,
            payment_ref=intent.id,
            meta=intent.metadata or {},
            payment_method="stripe",
        )
        return {"status": "success", "redirect": "/confirmation"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not finalize booking") from e


@router.post("/create-stripe-session")
async def create_stripe_session(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")
    assert_checkout_enabled()
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    booking_data = request.session.get("booking")
    if not booking_data:
        raise HTTPException(status_code=400, detail="Booking session expired. Please start again from the tour page.")

    tour = db.query(Tour).filter(Tour.id == booking_data["tour_id"]).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    try:
        total_price = float(booking_data["total_price"])
        unit_amount = booking_amount_cents(total_price)
        base_url = resolve_base_url(request)
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": unit_amount,
                        "product_data": {
                            "name": (tour.title or "Tour booking")[:120],
                            "description": (
                                f"{booking_data.get('adults', 0)} Adults, "
                                f"{booking_data.get('kids', 0)} Kids"
                            )[:500],
                        },
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            customer_email=user.email,
            client_reference_id=str(user.id),
            metadata=booking_metadata(request, user, tour, booking_data, total_price),
            success_url=f"{base_url}/api/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment?error=cancelled",
        )
        return {"id": session.id, "url": session.url}
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=getattr(e, "user_message", None) or str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {e}") from e


@router.post("/create-paypal-order")
async def create_paypal_order(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")
    assert_checkout_enabled()

    try:
        payload = await request.json()
    except Exception:
        payload = {}
    booking_data = apply_companion_updates(request, payload if isinstance(payload, dict) else {})
    if not booking_data:
        raise HTTPException(status_code=400, detail="Booking session expired. Please start again from the tour page.")

    tour = db.query(Tour).filter(Tour.id == booking_data["tour_id"]).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    total_price = float(booking_data["total_price"])
    if total_price <= 0:
        raise HTTPException(status_code=400, detail="Invalid booking amount")
    base_url = resolve_base_url(request)
    return_url = f"{base_url}/api/payment/paypal/return"
    cancel_url = f"{base_url}/api/payment/paypal/cancel"

    if not paypal_configured():
        raise HTTPException(
            status_code=503,
            detail="PayPal is missing PAYPAL_CLIENT_SECRET, so checkout cannot open PayPal.",
        )

    access = await paypal_access_token()
    order = await paypal_order_request(
        "POST",
        "/v2/checkout/orders",
        access,
        json_body={
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {"currency_code": "USD", "value": f"{total_price:.2f}"},
                    "description": (tour.title or "Tour booking")[:127],
                    "custom_id": paypal_custom_id(user, tour, booking_data, total_price),
                }
            ],
            "application_context": {
                "brand_name": "Mmondo Adventures",
                "landing_page": "LOGIN",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            },
        },
    )
    approve_url = next((link.get("href") for link in order.get("links") or [] if link.get("rel") == "approve"), None)
    if not approve_url:
        raise HTTPException(status_code=502, detail="PayPal did not return an approval URL")
    request.session["paypal_order_id"] = order.get("id")
    return {"id": order.get("id"), "url": approve_url}


@router.get("/paypal/return")
async def paypal_return(
    request: Request,
    token: str = "",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    frontend = FRONTEND_URL.rstrip("/")
    if not payments_enabled():
        return RedirectResponse(url=f"{frontend}/payment?error=paused", status_code=303)
    if not user:
        return RedirectResponse(url=f"{frontend}/login?next=/payment", status_code=303)
    if not token:
        return RedirectResponse(url=f"{frontend}/payment?error=missing_session", status_code=303)
    try:
        meta = {}
        payment_ref = token[:100]
        expected = request.session.get("paypal_order_id")
        if expected and expected != token:
            return RedirectResponse(url=f"{frontend}/payment?error=processing", status_code=303)

        if not paypal_configured():
            return RedirectResponse(url=f"{frontend}/payment?error=processing", status_code=303)
        order = await paypal_capture_order(token)
        status = str(order.get("status") or "").upper()
        if status not in ("COMPLETED", "APPROVED"):
            return RedirectResponse(url=f"{frontend}/payment?error=unpaid", status_code=303)
        units = order.get("purchase_units") or []
        unit = units[0] if units else {}
        meta = parse_paypal_custom_id(unit.get("custom_id"))
        captures = ((unit.get("payments") or {}).get("captures") or [{}])
        capture_id = captures[0].get("id") if captures else None
        payment_ref = str(capture_id or order.get("id") or token)[:100]
        meta_user = meta.get("user_id")
        if meta_user and str(meta_user) != str(user.id):
            return RedirectResponse(url=f"{frontend}/payment?error=processing", status_code=303)

        create_booking_from_payment(
            request,
            db,
            user,
            payment_ref=payment_ref,
            meta=meta,
            payment_method="paypal",
        )
        request.session.pop("paypal_order_id", None)
        return RedirectResponse(url=f"{frontend}/confirmation", status_code=303)
    except Exception:
        db.rollback()
        return RedirectResponse(url=f"{frontend}/payment?error=processing", status_code=303)


@router.get("/paypal/cancel")
async def paypal_cancel():
    frontend = FRONTEND_URL.rstrip("/")
    return RedirectResponse(url=f"{frontend}/payment?error=cancelled", status_code=303)


@router.get("/success")
async def payment_success(
    request: Request,
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    frontend = FRONTEND_URL.rstrip("/")
    if not user:
        return RedirectResponse(url=f"{frontend}/login?next=/payment", status_code=303)
    if not session_id:
        return RedirectResponse(url=f"{frontend}/payment?error=missing_session", status_code=303)
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status not in ("paid", "no_payment_required"):
            return RedirectResponse(url=f"{frontend}/payment?error=unpaid", status_code=303)
        payment_intent_id = session.payment_intent
        if isinstance(payment_intent_id, dict):
            payment_intent_id = payment_intent_id.get("id")
        payment_ref = str(payment_intent_id or session.id)[:100]
        create_booking_from_payment(
            request,
            db,
            user,
            payment_ref=payment_ref,
            meta=session.metadata or {},
            payment_method="stripe",
        )
        return RedirectResponse(url=f"{frontend}/confirmation", status_code=303)
    except Exception:
        db.rollback()
        return RedirectResponse(url=f"{frontend}/payment?error=processing", status_code=303)


@router.post("/complete")
async def complete_booking(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to complete payment")
    assert_checkout_enabled()
    try:
        booking_data = request.session.get("booking")
        payment_data = await request.json()
        if not booking_data:
            raise HTTPException(status_code=400, detail="Booking session expired")
        if "companions" in payment_data or "add_companions" in payment_data:
            add_companions = bool(payment_data.get("add_companions", booking_data.get("add_companions")))
            booking_data["add_companions"] = add_companions
            booking_data["companions"] = parse_companions(payment_data.get("companions")) if add_companions else []
            request.session["booking"] = booking_data
        payment_id = str(payment_data.get("payment_id") or payment_data.get("paymentID") or "")[:100]
        status = str(payment_data.get("status") or "completed")
        method = str(payment_data.get("payment_method") or "paypal").strip().lower()
        if method not in {"paypal", "card", "stripe"}:
            method = "paypal"
        if not payment_id:
            raise HTTPException(status_code=400, detail="Missing payment reference")

        existing = (
            db.query(Booking)
            .filter(Booking.payment_id == payment_id, Booking.user_id == user.id)
            .first()
        )
        if existing:
            request.session.pop("booking", None)
            return {"status": "success", "redirect": "/confirmation"}

        new_booking = Booking(
            user_id=user.id,
            tour_id=booking_data["tour_id"],
            adults=booking_data["adults"],
            kids=booking_data["kids"],
            tour_date=parse_booking_date(booking_data["tour_date"]),
            total_price=booking_data["total_price"],
            is_private=False,
            donation=booking_data.get("donation", 0.0),
            special_requirements=booking_data.get("special_requirements"),
            companions=companions_json(booking_data.get("companions") if booking_data.get("add_companions") else []),
            payment_method=method,
            payment_id=payment_id,
            payment_status=status.lower() if isinstance(status, str) else "completed",
            status="confirmed",
        )
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        send_booking_email(user, new_booking, payment_id)
        request.session.pop("booking", None)
        return {"status": "success", "redirect": "/confirmation"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Booking processing failed") from e


@router.get("/confirmation")
async def confirmation_page(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.tour).joinedload(Tour.images))
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc(), Booking.id.desc())
        .first()
    )
    reference = (
        f"MMA-{booking.created_at.year}-{booking.id:04d}"
        if booking and booking.created_at
        else (f"MMA-{booking.id:04d}" if booking else "MMA-PENDING")
    )
    return {
        "booking": booking_dict(booking) if booking else None,
        "tour": tour_dict(booking.tour) if booking and booking.tour else None,
        "reference": reference,
    }
