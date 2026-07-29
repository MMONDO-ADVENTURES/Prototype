import os
import stripe
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.models import User, Tour, Booking
from app.utils import get_current_user, login_url, send_email
from app.database import get_db
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def resolve_base_url(request: Request) -> str:
    """
    Prefer the live request origin for local/dev so Stripe/PayPal return
    to the same host the user is actually on. Fall back to BASE_URL in prod.
    """
    request_origin = str(request.base_url).rstrip("/")
    if any(host in request_origin for host in ("localhost", "127.0.0.1", "0.0.0.0")):
        return request_origin
    return (os.getenv("BASE_URL") or request_origin).rstrip("/")


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
    payment_line = (
        f"<li><strong>Payment ID:</strong> {payment_ref}</li>" if payment_ref else ""
    )
    try:
        send_email(
            user.email,
            "Booking Confirmation",
            f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
                <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <tr style="background-color: #9f4200; color: #ffffff;">
                    <td style="padding: 20px; font-size: 18px;">Booking Confirmation</td>
                </tr>
                <tr>
                    <td style="padding: 20px;">
                    <p>Dear {user.full_name},</p>
                    <p>Thank you for booking with Mmondo Adventures! Here are your booking details:</p>
                    <ul style="padding-left: 20px;">
                        <li><strong>Tour:</strong> {booking.tour.title if booking.tour else 'Your tour'}</li>
                        <li><strong>Date:</strong> {booking.tour_date}</li>
                        <li><strong>Adults:</strong> {booking.adults}</li>
                        <li><strong>Children:</strong> {booking.kids}</li>
                        <li><strong>Total:</strong> ${booking.total_price}</li>
                        {payment_line}
                        {special_reqs_text}
                    </ul>
                    <p>We look forward to providing you with a wonderful experience.</p>
                    <p>Best regards,<br>Mmondo Adventures Support Team</p>
                    </td>
                </tr>
                <tr style="background-color: #f0f0f0; text-align: center;">
                    <td style="padding: 10px; font-size: 12px; color: #777;">
                    &copy; {datetime.now().year} Mmondo Adventures. All rights reserved.
                    </td>
                </tr>
                </table>
            </body>
            </html>
            """,
            is_html=True,
        )
    except Exception as exc:
        # Never fail the paid booking because email delivery failed.
        print(f"Booking email error: {exc}")


def booking_metadata(request: Request, user: User, tour: Tour, booking_data: dict, total_price: float) -> dict:
    is_private = (
        request.session.get("tour_type") == "private"
        or booking_data.get("tour_type") == "private"
    )
    return {
        "user_id": str(user.id),
        "tour_id": str(tour.id),
        "adults": str(booking_data.get("adults", 0)),
        "kids": str(booking_data.get("kids", 0)),
        "total_price": f"{total_price:.2f}",
        "tour_date": str(booking_data.get("tour_date", "")),
        "is_private": "1" if is_private else "0",
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
        request.session.pop("tour_type", None)
        return existing

    booking_data = request.session.get("booking", {}) or {}
    tour_id = int(meta.get("tour_id") or booking_data.get("tour_id"))
    adults = int(meta.get("adults") or booking_data.get("adults") or 1)
    kids = int(meta.get("kids") or booking_data.get("kids") or 0)
    tour_date_raw = meta.get("tour_date") or booking_data.get("tour_date")
    total_price = float(meta.get("total_price") or booking_data.get("total_price") or 0)
    is_private = meta.get("is_private") == "1" or booking_data.get("tour_type") == "private"

    new_booking = Booking(
        user_id=user.id,
        tour_id=tour_id,
        adults=adults,
        kids=kids,
        tour_date=datetime.strptime(str(tour_date_raw), "%Y-%m-%d"),
        total_price=total_price,
        is_private=is_private,
        donation=float(booking_data.get("donation", 0) or 0),
        payment_method=payment_method,
        payment_id=payment_ref,
        special_requirements=booking_data.get("special_requirements"),
        payment_status="completed",
        status="confirmed",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    send_booking_email(user, new_booking, payment_ref)
    request.session.pop("booking", None)
    request.session.pop("tour_type", None)
    return new_booking


@router.get("/payment", response_class=HTMLResponse)
async def payment_page(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = request.session.get("booking")
    if not booking:
        return RedirectResponse(url="/tours", status_code=303)

    if not user:
        return RedirectResponse(url=login_url("/payment"), status_code=303)

    try:
        tour = db.query(Tour).filter(Tour.id == booking["tour_id"]).first()
        if not tour:
            request.session.pop("booking", None)
            return RedirectResponse(url="/tours", status_code=303)

        tour_image = tour.image_url
        if tour.images:
            primary = next((img for img in tour.images if img.is_primary), None)
            tour_image = (primary or tour.images[0]).image_url

        adults = int(booking.get("adults", 1))
        kids = int(booking.get("kids", 0))
        base_subtotal = float(booking.get("price", tour.price or 0)) * (adults + kids)
        is_private = (
            request.session.get("tour_type") == "private"
            or booking.get("tour_type") == "private"
        )
        donation = float(booking.get("donation", 0) or 0)
        private_premium = round(base_subtotal * 0.35, 2) if is_private else 0.0

        return templates.TemplateResponse(
            "payment.html",
            {
                "request": request,
                "user": user,
                "tour": tour,
                "tour_title": tour.title,
                "tour_id": tour.id,
                "tour_image": tour_image,
                "tour_date": booking.get("tour_date"),
                "adults": adults,
                "kids": kids,
                "travelers": adults + kids,
                "donation": donation,
                "special_requirements": booking.get("special_requirements"),
                "is_private": is_private,
                "base_price": tour.price,
                "base_subtotal": base_subtotal,
                "private_premium": private_premium,
                "total_price": float(booking["total_price"]),
                "paypal_client_id": os.getenv("PAYPAL_CLIENT_ID"),
                "stripe_public_key": os.getenv("STRIPE_PUBLIC_KEY"),
                "paypal_env": os.getenv("PAYPAL_MODE", "sandbox"),
                "payment_error": request.query_params.get("error"),
            },
        )

    except Exception as e:
        print(f"Payment error: {str(e)}")
        return RedirectResponse(url="/tours", status_code=303)


@router.post("/create-payment-intent")
async def create_payment_intent(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    booking_data = request.session.get("booking")
    if not booking_data:
        raise HTTPException(
            status_code=400,
            detail="Booking session expired. Please start again from the tour page.",
        )

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
        return JSONResponse(
            {
                "clientSecret": intent.client_secret,
                "paymentIntentId": intent.id,
            }
        )
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        print(f"Stripe PaymentIntent error: {e}")
        raise HTTPException(
            status_code=502,
            detail=getattr(e, "user_message", None) or str(e),
        ) from e
    except Exception as e:
        print(f"PaymentIntent error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {e}") from e


@router.post("/confirm-card-payment")
async def confirm_card_payment(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")

    payload = await request.json()
    payment_intent_id = str(payload.get("payment_intent_id") or "").strip()
    if not payment_intent_id:
        raise HTTPException(status_code=400, detail="Missing payment intent")

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status != "succeeded":
            raise HTTPException(
                status_code=400,
                detail=f"Payment not completed (status: {intent.status})",
            )
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
        return JSONResponse({"status": "success", "redirect": "/confirmation"})
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Confirm card payment error: {e}")
        raise HTTPException(status_code=500, detail="Could not finalize booking") from e


@router.post("/create-stripe-session")
async def create_stripe_session(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to continue payment")

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
            success_url=f"{base_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/payment?error=cancelled",
        )

        return JSONResponse({"id": session.id, "url": session.url})

    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        print(f"Stripe API error: {e}")
        raise HTTPException(status_code=502, detail=getattr(e, "user_message", None) or str(e)) from e
    except Exception as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {e}") from e


@router.get("/payment/success", response_class=HTMLResponse)
async def payment_success(
    request: Request,
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        return RedirectResponse(url=login_url("/payment"), status_code=303)

    if not session_id:
        return RedirectResponse(url="/payment?error=missing_session", status_code=303)

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status not in ("paid", "no_payment_required"):
            return RedirectResponse(url="/payment?error=unpaid", status_code=303)

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
        return RedirectResponse(url="/confirmation", status_code=303)

    except Exception as e:
        db.rollback()
        print(f"Payment success error: {str(e)}")
        return RedirectResponse(url="/payment?error=processing", status_code=303)


@router.post("/complete_booking")
async def complete_booking(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to complete payment")

    try:
        booking_data = request.session.get("booking")
        payment_data = await request.json()

        if not booking_data:
            raise HTTPException(status_code=400, detail="Booking session expired")

        payment_id = str(
            payment_data.get("payment_id")
            or payment_data.get("paymentID")
            or ""
        )[:100]
        status = str(payment_data.get("status") or "completed")
        if not payment_id:
            raise HTTPException(status_code=400, detail="Missing payment reference")

        existing = (
            db.query(Booking)
            .filter(Booking.payment_id == payment_id, Booking.user_id == user.id)
            .first()
        )
        if existing:
            request.session.pop("booking", None)
            return {"status": "success"}

        is_private = (
            request.session.get("tour_type") == "private"
            or booking_data.get("tour_type") == "private"
            or bool(payment_data.get("is_private"))
        )

        new_booking = Booking(
            user_id=user.id,
            tour_id=booking_data["tour_id"],
            adults=booking_data["adults"],
            kids=booking_data["kids"],
            tour_date=datetime.strptime(booking_data["tour_date"], "%Y-%m-%d"),
            total_price=booking_data["total_price"],
            is_private=is_private,
            donation=booking_data.get("donation", 0.0),
            special_requirements=booking_data.get("special_requirements"),
            payment_method="paypal",
            payment_id=payment_id,
            payment_status=status.lower() if isinstance(status, str) else "completed",
            status="confirmed",
        )

        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)

        send_booking_email(user, new_booking, payment_id)
        request.session.pop("booking", None)
        request.session.pop("tour_type", None)
        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Booking error: {str(e)}")
        raise HTTPException(status_code=500, detail="Booking processing failed") from e


@router.get("/confirmation", response_class=HTMLResponse)
async def confirmation_page(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        return RedirectResponse(url=login_url("/confirmation"), status_code=303)

    booking = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc(), Booking.id.desc())
        .first()
    )
    tour = booking.tour if booking else None
    reference = f"MMA-{booking.created_at.year}-{booking.id:04d}" if booking and booking.created_at else (
        f"MMA-{booking.id:04d}" if booking else "MMA-PENDING"
    )

    return templates.TemplateResponse(
        "confirmation.html",
        {
            "request": request,
            "user": user,
            "booking": booking,
            "tour": tour,
            "reference": reference,
        },
    )
