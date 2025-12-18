# app/routes/culture_admin.py
# Routes for managing culture content only

import os
import uuid
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Country, CountryImage, User
from app.utils import get_current_admin
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

UPLOAD_DIR = "static/uploads/cultures"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ====================== ADMIN CULTURE PAGES ======================

@router.get("/admin/cultures", response_class=HTMLResponse)
def admin_culture_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin dashboard to view all cultures"""
    countries = db.query(Country).order_by(Country.name).all()
    
    return templates.TemplateResponse(
        "admin/culture_dashboard.html",
        {
            "request": request,
            "countries": countries
        }
    )


@router.get("/admin/cultures/new", response_class=HTMLResponse)
def new_culture_page(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Page to create a new culture"""
    return templates.TemplateResponse(
        "admin/new_culture.html",
        {"request": request}
    )


@router.post("/admin/cultures/create")
async def create_culture(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(""),
    food: str = Form(""),
    dress: str = Form(""),
    traditions: str = Form(""),
    tour_themes: str = Form(""),
    video_url: str = Form(""),
    video_credit: str = Form(""),
    testimonial: str = Form(""),
    lat: str = Form(""),
    lng: str = Form(""),
    badge_label: str = Form(""),
    badge_color: str = Form("#0d6efd"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Create a new culture"""
    # Check if slug exists
    existing = db.query(Country).filter(Country.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Slug '{slug}' already exists")
    
    # Convert lat/lng to float if provided (handle empty strings)
    lat_float = float(lat) if lat and lat.strip() else None
    lng_float = float(lng) if lng and lng.strip() else None
    
    country = Country(
        name=name,
        slug=slug,
        description=description,  # Now included
        food=food,
        dress=dress,
        traditions=traditions,
        tour_themes=tour_themes,
        video_url=video_url,
        video_credit=video_credit,
        testimonial=testimonial,
        lat=lat_float,
        lng=lng_float,
        badge_label=badge_label,
        badge_color=badge_color
    )
    
    db.add(country)
    db.commit()
    db.refresh(country)
    
    return RedirectResponse(
        url=f"/admin/cultures/{country.id}/edit",
        status_code=303
    )


@router.get("/admin/cultures/{country_id}/edit", response_class=HTMLResponse)
def edit_culture_page(
    country_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Page to edit a specific culture's details"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Culture not found")
    
    return templates.TemplateResponse(
        "admin/edit_culture.html",
        {
            "request": request,
            "country": country
        }
    )


@router.post("/admin/cultures/{country_id}/update")
async def update_culture(
    country_id: int,
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(""),
    food: str = Form(""),
    dress: str = Form(""),
    traditions: str = Form(""),
    tour_themes: str = Form(""),
    video_url: str = Form(""),
    video_credit: str = Form(""),
    testimonial: str = Form(""),
    lat: str = Form(""),
    lng: str = Form(""),
    badge_label: str = Form(""),
    badge_color: str = Form("#0d6efd"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update culture details"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Culture not found")
    
    # Check if slug is taken by another country
    existing = db.query(Country).filter(
        Country.slug == slug,
        Country.id != country_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Slug '{slug}' already in use")
    
    # Convert lat/lng to float if provided (handle empty strings)
    lat_float = float(lat) if lat and lat.strip() else None
    lng_float = float(lng) if lng and lng.strip() else None
    
    # Update all fields
    country.name = name
    country.slug = slug
    country.description = description  # Now included
    country.food = food
    country.dress = dress
    country.traditions = traditions
    country.tour_themes = tour_themes
    country.video_url = video_url
    country.video_credit = video_credit
    country.testimonial = testimonial
    country.lat = lat_float
    country.lng = lng_float
    country.badge_label = badge_label
    country.badge_color = badge_color
    
    db.commit()
    
    return RedirectResponse(
        url=f"/admin/cultures/{country_id}/edit",
        status_code=303
    )


@router.post("/admin/cultures/{country_id}/upload-image")
async def upload_culture_image(
    country_id: int,
    image: UploadFile = File(...),
    alt_text: str = Form(""),
    is_primary: bool = Form(False),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Upload an image for a culture"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Culture not found")
    
    # Validate file
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid image format. Use JPG, PNG, or WEBP")
    
    # Save file
    filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        contents = await image.read()
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
    
    # If setting as primary, unset others
    if is_primary:
        db.query(CountryImage).filter(
            CountryImage.country_id == country_id,
            CountryImage.is_primary == True
        ).update({"is_primary": False})
    
    # Create image record - MATCHES YOUR MODEL
    db_image = CountryImage(
        country_id=country_id,
        image_url=f"/static/uploads/cultures/{filename}",
        alt_text=alt_text,
        is_primary=is_primary
    )
    
    db.add(db_image)
    db.commit()
    
    return RedirectResponse(
        url=f"/admin/cultures/{country_id}/edit",
        status_code=303
    )


@router.post("/admin/cultures/images/{image_id}/delete")
def delete_culture_image(
    image_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a culture image"""
    image = db.query(CountryImage).filter(CountryImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file
    if os.path.exists(image.filepath):
        os.remove(image.filepath)
    
    db.delete(image)
    db.commit()
    
    return RedirectResponse(
        url=f"/admin/cultures/{image.country_id}/edit",
        status_code=303
    )


@router.post("/admin/cultures/images/{image_id}/set-primary")
def set_primary_image(
    image_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Set an image as primary"""
    image = db.query(CountryImage).filter(CountryImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Unset all primary images for this country
    db.query(CountryImage).filter(
        CountryImage.country_id == image.country_id,
        CountryImage.is_primary == True
    ).update({"is_primary": False})
    
    # Set this as primary
    image.is_primary = True
    db.commit()
    
    return RedirectResponse(
        url=f"/admin/cultures/{image.country_id}/edit",
        status_code=303
    )


@router.post("/admin/cultures/{country_id}/delete")
def delete_culture(
    country_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a culture"""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Culture not found")
    
    # Delete associated images
    images = db.query(CountryImage).filter(CountryImage.country_id == country_id).all()
    for img in images:
        # Extract filename from image_url
        if img.image_url:
            filename = img.image_url.split("/")[-1]
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        db.delete(img)
    
    db.delete(country)
    db.commit()
    
    return RedirectResponse(url="/admin/cultures", status_code=303)


# ====================== PUBLIC CULTURE PAGE ======================

@router.get("/cultures", response_class=HTMLResponse)
def cultures_main_page(
    request: Request,
    db: Session = Depends(get_db)
):
    """Public page showing all cultures"""
    countries = db.query(Country).order_by(Country.name).all()
    
    # Format for template
    regions = []
    for country in countries:
        # Get images - MATCHES YOUR MODEL
        images = [
            {
                "url": img.image_url,
                "alt": img.alt_text or country.name
            }
            for img in country.images
        ]
        
        # Create region object matching your template
        region = {
            "slug": country.slug,
            "name": country.name,
            "country_slug": country.slug,
            "country_name": country.name,
            "description": country.description or "",  # Now included
            "images": images,
            "food": country.food or "",
            "dress": country.dress or "",
            "traditions": country.traditions or "",
            "tour_themes": country.tour_themes or "",
            "video_url": country.video_url or "",
            "video_credit": country.video_credit or "",
            "testimonial": country.testimonial or "",
            "tours_url": f"/tours?country={country.slug}",
            "itinerary_url": f"/itinerary?country={country.slug}",
            "badge_label": country.badge_label or "",
            "badge_color": country.badge_color or "#0d6efd",
            "interests": []
        }
        regions.append(region)
    
    # Get destinations for map
    destinations = []
    for country in countries:
        if country.lat and country.lng:
            destinations.append({
                "slug": country.slug,
                "name": country.name,
                "country_name": country.name,
                "lat": country.lat,
                "lng": country.lng,
                "tours_url": f"/tours?country={country.slug}"
            })
    
    # Prepare data for filters
    country_options = [{"slug": c.slug, "name": c.name} for c in countries]
    
    # Note: You'll need to fetch festivals, stories, locals from your database
    # For now, returning empty lists
    festivals = []
    stories = []
    locals_list = []
    
    return templates.TemplateResponse(
        "culture.html",  # Your existing template
        {
            "request": request,
            "regions": regions,
            "destinations": destinations,
            "country_options": country_options,
            "festivals": festivals,
            "stories": stories,
            "locals": locals_list,
            "interests": [],
            "page_title": "East Africa Cultures | Mmondo Adventures",
            "header_title": "East Africa Cultural Tour Bank",
            "header_subtitle": "Discover food, dance, dress and traditions across East Africa – curated by Mmondo Adventures.",
            "current_year": 2025
        }
    )


@router.get("/cultures/{country_slug}", response_class=HTMLResponse)
def culture_detail_page(
    country_slug: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Public page for a specific culture"""
    country = db.query(Country).filter(Country.slug == country_slug).first()
    if not country:
        raise HTTPException(status_code=404, detail="Culture not found")
    
    # Get images - MATCHES YOUR MODEL
    images = [
        {
            "url": img.image_url,
            "alt": img.alt_text or country.name,
            "is_primary": img.is_primary
        }
        for img in country.images
    ]
    
    return templates.TemplateResponse(
        "culture_detail.html",
        {
            "request": request,
            "culture": country,
            "images": images,
            "page_title": f"{country.name} - Cultural Experience"
        }
    )