from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.enquiries import notify_tour_inquiry
from app.models import Tour
from app.schemas import TourInquiryRequest

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])

INTEREST_LEVELS = {
    "just_exploring": "Just exploring",
    "likely_to_book": "Likely to book",
    "ready_soon": "Ready to book soon",
}


@router.post("")
async def create_inquiry(payload: TourInquiryRequest, db: Session = Depends(get_db)):
    first = (payload.first_name or "").strip()
    last = (payload.last_name or "").strip()
    name = " ".join(part for part in (first, last) if part).strip()
    email = (payload.email or "").strip()
    if not first or not email:
        raise HTTPException(status_code=400, detail="Please add your name and email so we can contact you.")
    if payload.people < 1:
        raise HTTPException(status_code=400, detail="Please add at least one traveller.")

    tour = db.query(Tour).filter(Tour.id == payload.tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    interest = INTEREST_LEVELS.get(payload.interest_level, "") or (payload.interest_level or "").strip()
    if not interest:
        raise HTTPException(status_code=400, detail="Please choose how interested you are.")

    result = notify_tour_inquiry(
        name=name or first,
        email=email,
        phone=(payload.phone or "").strip(),
        tour_title=tour.title,
        preferred_date=(payload.preferred_date or "").strip(),
        people=int(payload.people),
        interest_level=interest,
        message=(payload.message or "").strip(),
        source="tour page",
    )
    return {
        "success": True,
        "message": "Thank you. This is an expression of interest, not a booking. We will contact you shortly.",
        **result,
    }
