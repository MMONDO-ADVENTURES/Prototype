import uuid
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.models import User
from app.utils import get_current_user
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)

@router.get("/subscribe_newsletter", response_class=HTMLResponse)
@router.post("/subscribe_newsletter", response_class=HTMLResponse)
async def subscribe_newsletter(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if request.method == "GET":
        return templates.TemplateResponse("newsletter.html", {
            "request": request,
            "is_subscribed": user.newsletter_subscribed if user else False
        })
    
    if not user:
        return RedirectResponse(url="/login", status_code=303)
    
    if user.newsletter_subscribed:
        return RedirectResponse(url="/newsletter_status", status_code=303)
    
    user.newsletter_subscribed = True
    db.commit()
    
    return templates.TemplateResponse("newsletter.html", {
        "request": request,
        "message": "Successfully subscribed to our newsletter!",
        "is_subscribed": True
    })

@router.get("/unsubscribe_newsletter", response_class=HTMLResponse)
async def unsubscribe_newsletter(
    request: Request,
    token: str = Query(..., description="Unsubscribe token"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.unsubscribe_token == token).first()
    if not user:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "error": "Invalid unsubscribe link"
        })
    
    user.newsletter_subscribed = False
    user.unsubscribe_token = str(uuid.uuid4())
    db.commit()
    
    return templates.TemplateResponse("newsletter.html", {
        "request": request,
        "message": "You've been unsubscribed from our newsletter",
        "is_subscribed": False,
        "email": user.email
    })

@router.post("/user/unsubscribe_newsletter", response_class=HTMLResponse)
async def user_unsubscribe_newsletter(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user.newsletter_subscribed = False
    user.unsubscribe_token = str(uuid.uuid4())
    db.commit()
    
    return templates.TemplateResponse("newsletter.html", {
        "request": request,
        "message": "You've been unsubscribed from our newsletter",
        "is_subscribed": False,
        "email": user.email
    })

@router.get("/newsletter_status", response_class=HTMLResponse)
async def newsletter_status(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return templates.TemplateResponse("newsletter.html", {
        "request": request,
        "is_subscribed": user.newsletter_subscribed,
        "message": f"You are {'subscribed' if user.newsletter_subscribed else 'not subscribed'} to our newsletter"
    })