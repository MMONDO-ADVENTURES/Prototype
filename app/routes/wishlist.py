from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Tour, User, WishlistEntry
from app.utils import get_current_user

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)


@router.get("/wishlist/{tour_id}", response_class=HTMLResponse)
async def wishlist_form(
    request: Request,
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        return RedirectResponse(url="/tours", status_code=303)

    today = datetime.now().date().isoformat()
    submitted = request.query_params.get("submitted") == "1"

    return templates.TemplateResponse(
        "wishlist.html",
        {
            "request": request,
            "tour": tour,
            "user": user,
            "today": today,
            "submitted": submitted,
        },
    )


@router.post("/wishlist/{tour_id}", response_class=HTMLResponse)
async def submit_wishlist(
    request: Request,
    tour_id: int,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    adults: int = Form(1),
    kids: int = Form(0),
    country: Optional[str] = Form(None),
    preferred_date: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    if adults < 1:
        raise HTTPException(status_code=400, detail="At least 1 adult is required")
    if kids < 0:
        raise HTTPException(status_code=400, detail="Invalid number of children")

    preferred_date_obj = None
    if preferred_date:
        try:
            preferred_date_obj = datetime.strptime(preferred_date, "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid preferred date") from exc

    entry = WishlistEntry(
        tour_id=tour_id,
        user_id=user.id if user else None,
        full_name=full_name.strip(),
        email=email.strip().lower(),
        phone=phone.strip(),
        country=country.strip() if country else None,
        preferred_date=preferred_date_obj,
        adults=adults,
        kids=kids,
        message=message.strip() if message else None,
    )
    db.add(entry)
    db.commit()

    return RedirectResponse(url=f"/wishlist/{tour_id}?submitted=1", status_code=303)
