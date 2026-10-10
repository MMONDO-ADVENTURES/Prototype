from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Booking, Tour, User
from app.schemas import BookingCreateRequest, BookingUpdateRequest, PendingCompanionsRequest
from app.serializers import booking_dict, clamp_group_size, companions_json, parse_companions, tour_dict
from app.utils import (
    can_cancel_booking,
    can_edit_booking,
    get_current_user,
    last_free_change_date,
    send_email,
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("")
async def process_booking(
    payload: BookingCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.adults < 1:
        raise HTTPException(status_code=400, detail="At least 1 adult required")
    if payload.kids < 0:
        raise HTTPException(status_code=400, detail="Invalid number of kids")

    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == payload.tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    group_size = payload.adults + payload.kids
    if group_size > clamp_group_size(tour.max_participants):
        raise HTTPException(status_code=400, detail="This tour is limited to 5 travellers.")

    try:
        tour_date_obj = datetime.strptime(payload.tour_date, "%Y-%m-%d").date()
        if tour_date_obj < datetime.today().date():
            raise ValueError("Date in past")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid tour date") from exc

    total_price = tour.calculate_price(payload.adults, payload.kids)

    donation_amount = 10.0 if payload.donate else 0.0
    total_price += donation_amount
    request.session["booking"] = {
        "tour_id": payload.tour_id,
        "adults": payload.adults,
        "kids": payload.kids,
        "price": float(tour.price),
        "price_unit": getattr(tour, "price_unit", None) or "person",
        "tour_date": payload.tour_date,
        "donation": donation_amount,
        "special_requirements": payload.special_requirements,
        "add_companions": bool(payload.add_companions),
        "companions": parse_companions(
            [{"full_name": item.full_name, "role": item.role, "details": item.details} for item in payload.companions]
        ),
        "total_price": float(total_price),
    }

    return {
        "success": True,
        "requires_login": False,
        "redirect": "/payment",
        "booking": request.session["booking"],
        "tour": tour_dict(tour),
    }


@router.get("/pending")
async def pending_booking(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    booking = request.session.get("booking")
    if not booking:
        return {"booking": None}
    tour = db.query(Tour).options(joinedload(Tour.images), joinedload(Tour.creator)).filter(Tour.id == booking["tour_id"]).first()
    if not tour:
        request.session.pop("booking", None)
        return {"booking": None}

    adults = int(booking.get("adults", 1))
    kids = int(booking.get("kids", 0))
    base_subtotal = tour.calculate_price(adults, kids)
    donation = float(booking.get("donation", 0) or 0)
    tour_image = tour.image_url
    if tour.images:
        primary = next((img for img in tour.images if img.is_primary), None)
        tour_image = (primary or tour.images[0]).image_url

    return {
        "authenticated": user is not None,
        "tour": tour_dict(tour),
        "tour_image": tour_image,
        "tour_date": booking.get("tour_date"),
        "adults": adults,
        "kids": kids,
        "travelers": adults + kids,
        "donation": donation,
        "special_requirements": booking.get("special_requirements"),
        "add_companions": bool(booking.get("add_companions")),
        "companions": parse_companions(booking.get("companions")),
        "base_price": tour.price,
        "price_unit": getattr(tour, "price_unit", None) or "person",
        "base_subtotal": base_subtotal,
        "total_price": float(booking["total_price"]),
    }


@router.patch("/pending")
async def update_pending_companions(
    payload: PendingCompanionsRequest,
    request: Request,
):
    booking = request.session.get("booking")
    if not booking:
        raise HTTPException(status_code=400, detail="Booking session expired. Please start again from the tour page.")
    companions = parse_companions(
        [{"full_name": item.full_name, "role": item.role, "details": item.details} for item in payload.companions]
    )
    booking["add_companions"] = bool(payload.add_companions)
    booking["companions"] = companions if payload.add_companions else []
    request.session["booking"] = booking
    return {"success": True, "companions": booking["companions"], "add_companions": booking["add_companions"]}


@router.get("/mine")
async def my_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    one_month_ago = datetime.utcnow() - timedelta(days=30)
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.tour).joinedload(Tour.images))
        .filter(
            Booking.user_id == user.id,
            Booking.deleted_at.is_(None),
            or_(
                Booking.payment_status != "cancelled",
                and_(
                    Booking.payment_status == "cancelled",
                    Booking.cancelled_at >= one_month_ago,
                ),
            ),
        )
        .order_by(Booking.created_at.desc())
        .all()
    )
    return {
        "bookings": [booking_dict(item) for item in bookings],
        "now": datetime.utcnow().isoformat(),
    }


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    cancellation_deadline = last_free_change_date(booking.tour_date)
    if not can_cancel_booking(booking):
        cutoff = cancellation_deadline.isoformat() if cancellation_deadline else "the cutoff date"
        raise HTTPException(
            status_code=400,
            detail=f"Free cancellation is available until {cutoff} (3 days before the start date).",
        )

    booking.payment_status = "cancelled"
    booking.status = "cancelled"
    booking.cancelled_at = datetime.utcnow()
    db.commit()
    try:
        send_email(
            user.email,
            "Booking Cancellation Confirmation",
            f"<p>Dear {user.full_name}, your booking for {booking.tour.title if booking.tour else 'your tour'} has been cancelled.</p>",
            is_html=True,
        )
    except Exception:
        pass
    return {"success": True, "message": "Booking cancelled"}


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: int,
    payload: BookingUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.tour))
        .filter(Booking.id == booking_id, Booking.user_id == user.id, Booking.deleted_at.is_(None))
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not can_edit_booking(booking):
        raise HTTPException(status_code=400, detail="This booking can no longer be edited.")

    adults = booking.adults if payload.adults is None else payload.adults
    kids = booking.kids if payload.kids is None else payload.kids
    if adults < 1:
        raise HTTPException(status_code=400, detail="At least 1 adult required")
    if kids < 0:
        raise HTTPException(status_code=400, detail="Invalid number of kids")
    tour = booking.tour
    if tour and adults + kids > clamp_group_size(tour.max_participants):
        raise HTTPException(status_code=400, detail="This tour is limited to 5 travellers.")

    if payload.tour_date:
        try:
            tour_date_obj = datetime.strptime(payload.tour_date[:10], "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid tour date") from exc
        if tour_date_obj.date() < datetime.today().date():
            raise HTTPException(status_code=400, detail="Choose a date that is not in the past.")
        booking.tour_date = tour_date_obj

    booking.adults = adults
    booking.kids = kids
    if payload.special_requirements is not None:
        booking.special_requirements = payload.special_requirements
    if payload.add_companions is not None or payload.companions is not None:
        add_companions = bool(payload.add_companions) if payload.add_companions is not None else bool(parse_companions(booking.companions))
        companions = parse_companions(
            [{"full_name": item.full_name, "role": item.role, "details": item.details} for item in (payload.companions or [])]
        )
        booking.companions = companions_json(companions if add_companions else [])

    if tour:
        booking.total_price = tour.calculate_price(adults, kids) + float(booking.donation or 0)
    else:
        booking.total_price = float(booking.donation or 0)
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking": booking_dict(booking)}


@router.post("/{booking_id}/delete")
async def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == user.id,
            Booking.payment_status == "cancelled",
            Booking.deleted_at.is_(None),
        )
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.deleted_at = datetime.utcnow()
    db.commit()
    return {"success": True}
