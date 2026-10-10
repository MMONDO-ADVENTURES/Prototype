from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Review, Tour
from app.serializers import tour_dict, clamp_group_size

router = APIRouter(prefix="/api", tags=["tours"])


def _tour_matches_place(tour: Tour, place: str) -> bool:
    term = (place or "").strip().lower()
    if not term:
        return True
    haystack = " ".join(
        part
        for part in (
            tour.title,
            tour.description,
            tour.locations,
            getattr(tour, "destinations", None),
            getattr(tour, "accommodations", None),
            getattr(tour, "tour_types", None),
            tour.country,
            tour.tour_type,
            getattr(tour, "languages", None),
            getattr(getattr(tour, "creator", None), "company_name", None),
            getattr(getattr(tour, "creator", None), "full_name", None),
        )
        if part
    ).lower()
    if term in haystack:
        return True
    tokens = [token for token in term.replace(",", " ").split() if len(token) > 1]
    return bool(tokens) and all(token in haystack for token in tokens)


def _booked_on_date(tour: Tour, travel_date) -> int:
    total = 0
    for booking in tour.bookings or []:
        if booking.cancelled_at or booking.deleted_at or not booking.tour_date:
            continue
        booking_day = booking.tour_date.date() if hasattr(booking.tour_date, "date") else booking.tour_date
        if booking_day != travel_date:
            continue
        status = (booking.payment_status or "").lower()
        if status in {"failed", "cancelled"}:
            continue
        total += (booking.adults or 0) + (booking.kids or 0)
    return total


@router.get("/tours")
async def list_tours(
    active_only: bool = False,
    q: str = "",
    date: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(Tour).options(
        joinedload(Tour.images),
        joinedload(Tour.reviews),
        joinedload(Tour.creator),
        joinedload(Tour.bookings),
    )
    if active_only:
        query = query.filter(Tour.is_active == True)  # noqa: E712
    tours = query.order_by(Tour.created_at.desc()).all()
    if q.strip():
        tours = [tour for tour in tours if _tour_matches_place(tour, q)]
    if date:
        try:
            travel_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            travel_date = None
        if travel_date:
            tours = [
                tour
                for tour in tours
                if tour.is_active and _booked_on_date(tour, travel_date) < clamp_group_size(tour.max_participants)
            ]
    return {"tours": [tour_dict(tour) for tour in tours]}


@router.get("/tours/{tour_id}")
async def get_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = (
        db.query(Tour)
        .options(
            joinedload(Tour.images),
            joinedload(Tour.reviews).joinedload(Review.user),
            joinedload(Tour.creator),
        )
        .filter(Tour.id == tour_id)
        .first()
    )
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    from datetime import datetime

    return {"tour": tour_dict(tour, include_reviews=True), "today": datetime.now().date().isoformat()}
