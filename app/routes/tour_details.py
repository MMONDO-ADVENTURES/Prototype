from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.models import Tour, User
from app.utils import get_current_user
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)

@router.get("/tour/{tour_id}", response_class=HTMLResponse)
async def tour_details_page(
    request: Request,
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Fetch the specific tour by ID
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    
    # If tour doesn't exist, return 404
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return templates.TemplateResponse(
        "tour_details.html",
        {
            "request": request,
            "title": f"{tour.title} - Pearl Tours",
            "is_logged_in": user is not None,
            "user": user,
            "tour": tour
        }
    )