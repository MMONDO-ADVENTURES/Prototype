import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils import get_current_user
import os

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.get("/status")
async def newsletter_status(user: User = Depends(get_current_user)):
    return {
        "authenticated": bool(user),
        "is_subscribed": bool(user.newsletter_subscribed) if user else False,
        "email": user.email if user else None,
    }


@router.post("/subscribe")
async def subscribe_newsletter(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    user.newsletter_subscribed = True
    db.commit()
    return {
        "success": True,
        "message": "Successfully subscribed to our newsletter!",
        "is_subscribed": True,
    }


@router.post("/unsubscribe")
async def user_unsubscribe_newsletter(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    user.newsletter_subscribed = False
    user.unsubscribe_token = str(uuid.uuid4())
    db.commit()
    return {
        "success": True,
        "message": "You've been unsubscribed from our newsletter",
        "is_subscribed": False,
        "email": user.email,
    }


@router.get("/unsubscribe")
async def unsubscribe_newsletter(
    token: str = Query(..., description="Unsubscribe token"),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.unsubscribe_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid unsubscribe link")
    user.newsletter_subscribed = False
    user.unsubscribe_token = str(uuid.uuid4())
    db.commit()
    return RedirectResponse(
        url=f"{FRONTEND_URL.rstrip('/')}/newsletter?unsubscribed=1",
        status_code=303,
    )
