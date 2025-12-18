# app/routes/superadmin.py
from fastapi import APIRouter, Request, Depends, HTTPException, status, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, extract, func
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import User, Booking, Tour, Country, CountryImage
from app.utils import get_current_superadmin, get_dashboard_stats, get_recent_bookings, get_top_tours

router = APIRouter(prefix="/superadmin", tags=["superadmin"])
templates = Jinja2Templates(directory="app/templates")

# ============ SUPERADMIN CORE ROUTES ============

# SuperAdmin Dashboard
@router.get("/dashboard", response_class=HTMLResponse)
async def superadmin_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    stats = get_dashboard_stats(db)
    recent_bookings = get_recent_bookings(db, 10)
    top_tours = get_top_tours(db, 5)
    
    return templates.TemplateResponse(
        "superadmin/dashboard.html",
        {
            "request": request,
            "stats": stats,
            "recent_bookings": recent_bookings,
            "top_tours": top_tours,
            "superadmin": superadmin
        }
    )

# Manage Admins
@router.get("/admins", response_class=HTMLResponse)
async def manage_admins(
    request: Request,
    search: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    query = db.query(User).filter(
        or_(User.is_admin == True, User.is_superadmin == True)
    )
    
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.company_name.ilike(f"%{search}%")
            )
        )
    
    admins = query.order_by(User.created_at.desc()).all()
    
    return templates.TemplateResponse(
        "superadmin/admins.html",
        {
            "request": request,
            "admins": admins,
            "search": search,
            "superadmin": superadmin
        }
    )

# Delete Admin
@router.post("/admins/{admin_id}/delete")
async def delete_admin(
    admin_id: int,
    request: Request,
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    if admin_id == superadmin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Prevent deleting other superadmins
    if admin.is_superadmin and admin.id != superadmin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete other superadmins"
        )
    
    # Soft delete: set as inactive
    admin.is_active = False
    admin.is_admin = False
    admin.is_superadmin = False
    db.commit()
    
    return RedirectResponse("/superadmin/admins", status_code=303)

# View Tour Companies
@router.get("/companies", response_class=HTMLResponse)
async def view_companies(
    request: Request,
    search: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    query = db.query(User).filter(
        User.company_name.isnot(None),
        User.company_name != ''
    )
    
    if search:
        query = query.filter(
            or_(
                User.company_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    
    companies = query.order_by(User.created_at.desc()).all()
    
    return templates.TemplateResponse(
        "superadmin/companies.html",
        {
            "request": request,
            "companies": companies,
            "search": search,
            "superadmin": superadmin
        }
    )

# View All Bookings
@router.get("/bookings", response_class=HTMLResponse)
async def view_all_bookings(
    request: Request,
    status_filter: str = Query("all"),
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    query = db.query(Booking).join(User).join(Tour).filter(
        Booking.deleted_at.is_(None)
    )
    
    # Apply filters
    if status_filter and status_filter != "all":
        if status_filter == "completed":
            query = query.filter(Booking.payment_status == "completed")
        elif status_filter == "pending":
            query = query.filter(Booking.payment_status == "pending")
        elif status_filter == "cancelled":
            query = query.filter(Booking.cancelled_at.isnot(None))
    
    # Date filters
    if date_from:
        date_from_dt = datetime.strptime(date_from, "%Y-%m-%d")
        query = query.filter(Booking.created_at >= date_from_dt)
    
    if date_to:
        date_to_dt = datetime.strptime(date_to, "%Y-%m-%d")
        query = query.filter(Booking.created_at <= date_to_dt)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    
    return templates.TemplateResponse(
        "superadmin/bookings.html",
        {
            "request": request,
            "bookings": bookings,
            "status_filter": status_filter,
            "date_from": date_from,
            "date_to": date_to,
            "superadmin": superadmin
        }
    )

# View Revenue Analytics
@router.get("/revenue", response_class=HTMLResponse)
async def revenue_analytics(
    request: Request,
    period: str = Query("monthly"),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    # Get revenue by month for the last 6 months
    revenue_by_month = db.query(
        extract('month', Booking.created_at).label('month'),
        extract('year', Booking.created_at).label('year'),
        func.sum(Booking.total_price).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).filter(
        Booking.deleted_at.is_(None),
        Booking.payment_status == 'completed',
        Booking.created_at >= datetime.utcnow() - timedelta(days=180)
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    # Get revenue by tour
    revenue_by_tour = db.query(
        Tour.title,
        func.sum(Booking.total_price).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).join(Booking, Tour.id == Booking.tour_id).filter(
        Booking.deleted_at.is_(None),
        Booking.payment_status == 'completed'
    ).group_by(Tour.id, Tour.title).order_by(func.sum(Booking.total_price).desc()).limit(10).all()
    
    return templates.TemplateResponse(
        "superadmin/revenue.html",
        {
            "request": request,
            "revenue_by_month": revenue_by_month,
            "revenue_by_tour": revenue_by_tour,
            "period": period,
            "superadmin": superadmin
        }
    )

# ============ CULTURE MANAGEMENT ROUTES ============

@router.get("/culture", response_class=HTMLResponse)
async def superadmin_culture_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """Super admin culture management dashboard"""
    # Get all countries with images
    countries = db.query(Country).options(
        joinedload(Country.images)
    ).order_by(Country.name).all()
    
    return templates.TemplateResponse(
        "superadmin/culture_dashboard.html",
        {
            "request": request, 
            "countries": countries,
            "superadmin": superadmin
        }
    )

@router.get("/culture/new", response_class=HTMLResponse)
async def new_culture_page(
    request: Request,
    superadmin: User = Depends(get_current_superadmin)
):
    """Create new culture page"""
    return templates.TemplateResponse(
        "superadmin/new_culture.html",
        {
            "request": request,
            "superadmin": superadmin
        }
    )

@router.post("/culture/new")
async def create_culture(
    request: Request,
    slug: str = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    food: str = Form(...),
    dress: str = Form(...),
    traditions: str = Form(...),
    tour_themes: str = Form(...),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """Create new culture entry"""
    # Check if slug exists
    existing = db.query(Country).filter(Country.slug == slug).first()
    if existing:
        return RedirectResponse(
            url="/superadmin/culture/new?error=Slug+already+exists",
            status_code=303
        )
    
    # Create new country
    new_country = Country(
        slug=slug,
        name=name,
        description=description,
        food=food,
        dress=dress,
        traditions=traditions,
        tour_themes=tour_themes
    )
    
    db.add(new_country)
    db.commit()
    
    return RedirectResponse(url="/superadmin/culture", status_code=303)

@router.get("/culture/edit/{country_id}", response_class=HTMLResponse)
async def edit_culture_page(
    request: Request,
    country_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """Edit culture page"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    return templates.TemplateResponse(
        "superadmin/edit_culture.html",
        {
            "request": request,
            "country": country,
            "superadmin": superadmin
        }
    )

@router.post("/culture/edit/{country_id}")
async def update_culture(
    request: Request,
    country_id: int,
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(...),
    food: str = Form(...),
    dress: str = Form(...),
    traditions: str = Form(...),
    tour_themes: str = Form(...),
    video_url: str = Form(None),
    video_credit: str = Form(None),
    testimonial: str = Form(None),
    badge_label: str = Form(None),
    badge_color: str = Form(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """Update culture entry"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    # Update country fields
    country.name = name
    country.slug = slug
    country.description = description
    country.food = food
    country.dress = dress
    country.traditions = traditions
    country.tour_themes = tour_themes
    country.video_url = video_url
    country.video_credit = video_credit
    country.testimonial = testimonial
    country.badge_label = badge_label
    country.badge_color = badge_color
    
    db.commit()
    
    return RedirectResponse(url="/superadmin/culture", status_code=303)