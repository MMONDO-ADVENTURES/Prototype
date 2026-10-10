from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Tour, User, WishlistEntry
from app.schemas import WishlistCreateRequest
from app.serializers import tour_dict, wishlist_dict
from app.utils import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("")
@router.get("/")
async def list_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user:
        return {"entries": [], "user": False}
    entries = (
        db.query(WishlistEntry)
        .options(joinedload(WishlistEntry.tour).joinedload(Tour.images))
        .filter(WishlistEntry.user_id == user.id)
        .order_by(WishlistEntry.created_at.desc())
        .all()
    )
    return {"entries": [wishlist_dict(entry) for entry in entries], "user": True}


@router.get("/{tour_id}")
async def wishlist_form(
    tour_id: int,
    preferred_date: Optional[str] = None,
    adults: Optional[int] = None,
    message: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    if preferred_date:
        try:
            datetime.strptime(preferred_date, "%Y-%m-%d")
        except ValueError:
            preferred_date = None
    return {
        "tour": tour_dict(tour),
        "today": datetime.now().date().isoformat(),
        "prefill": {
            "full_name": user.full_name if user else "",
            "email": user.email if user else "",
            "phone": user.phone if user else "",
            "preferred_date": preferred_date or "",
            "adults": adults if adults and adults >= 1 else 1,
            "message": message or "",
        },
        "user": bool(user),
    }


@router.post("/{tour_id}/save")
async def save_tour(tour_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Log in to save tours")
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    existing = (
        db.query(WishlistEntry)
        .filter(WishlistEntry.user_id == user.id, WishlistEntry.tour_id == tour_id)
        .first()
    )
    if existing:
        return {"success": True, "saved": True, "entry": wishlist_dict(existing)}
    entry = WishlistEntry(
        tour_id=tour_id,
        user_id=user.id,
        full_name=(user.full_name or "").strip() or "Traveller",
        email=user.email,
        phone=(user.phone or "").strip() or "n/a",
        adults=1,
        kids=0,
        message="Saved from tour card",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"success": True, "saved": True, "entry": wishlist_dict(entry)}


@router.delete("/{tour_id}/save")
async def unsave_tour(tour_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Log in to update your wishlist")
    deleted = (
        db.query(WishlistEntry)
        .filter(WishlistEntry.user_id == user.id, WishlistEntry.tour_id == tour_id)
        .delete()
    )
    db.commit()
    return {"success": True, "saved": False, "removed": deleted}


@router.post("/{tour_id}")
async def submit_wishlist(
    tour_id: int,
    payload: WishlistCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    if payload.adults < 1:
        raise HTTPException(status_code=400, detail="At least 1 adult is required")
    if payload.kids < 0:
        raise HTTPException(status_code=400, detail="Invalid number of children")

    preferred_date_obj = None
    if payload.preferred_date:
        try:
            preferred_date_obj = datetime.strptime(payload.preferred_date, "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid preferred date") from exc

    entry = WishlistEntry(
        tour_id=tour_id,
        user_id=user.id if user else None,
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        country=payload.country.strip() if payload.country else None,
        preferred_date=preferred_date_obj,
        adults=payload.adults,
        kids=payload.kids,
        message=payload.message.strip() if payload.message else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"success": True, "entry": wishlist_dict(entry)}
