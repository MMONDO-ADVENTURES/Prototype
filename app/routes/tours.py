from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.models import Tour, User
from app.utils import get_current_user
from app.database import get_db
from fastapi.templating import Jinja2Templates
from sqlalchemy import func

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)

@router.get("/", response_class=HTMLResponse)
async def read_root(
    request: Request,
    db: Session = Depends(get_db),  # Added database dependency
    user: User = Depends(get_current_user),
):
    # Fetch tours from database
    tours = db.query(Tour).filter(Tour.is_active == True).all()  # Only active tours
    
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "user": user,
            "tours": tours  # Added tours to template context
        }
    )


@router.get("/about", response_class=HTMLResponse)
async def about_page(
    request: Request,
    user: User = Depends(get_current_user),
):
    return templates.TemplateResponse(
        "about.html",
        {"request": request, "user": user},
    )


@router.get("/contact", response_class=HTMLResponse)
async def contact_page(
    request: Request,
    user: User = Depends(get_current_user),
):
    return templates.TemplateResponse(
        "contact.html",
        {"request": request, "user": user},
    )


@router.get("/tours", response_class=HTMLResponse)
async def tours_page(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tours = db.query(Tour).all()
    return templates.TemplateResponse(
        "tours.html",
        {
            "request": request,
            "title": "Our Tours",
            "is_logged_in": user is not None,
            "user": user,
            "tours": tours
        }
    )