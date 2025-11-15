import uuid
import os
from fastapi import APIRouter, Request, Depends, HTTPException, Form, File, UploadFile, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models import User, Tour, TourImage
from app.utils import get_current_admin, notify_subscribers
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get('/admin/dashboard', response_class=HTMLResponse)
async def admin_dashboard(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    if not user.is_admin:
        return RedirectResponse(url="/", status_code=303)
    tours = db.query(Tour).all()
    return templates.TemplateResponse("admin/dashboard.html", {"request": request, "user": user, "tours": tours})

@router.post('/admin/tours/create', response_class=HTMLResponse)
async def create_tour(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    duration: str = Form(...),
    locations: str = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    try:
        if not images:
            request.session['error'] = "At least one image is required"
            return RedirectResponse(url="/admin/tours/create", status_code=303)

        new_tour = Tour(
            title=title,
            description=description,
            price=price,
            duration=duration,
            locations=locations
        )
        db.add(new_tour)
        db.flush()

        upload_dir = "static/uploads"
        os.makedirs(upload_dir, exist_ok=True)

        for idx, image in enumerate(images):
            if not image.content_type.startswith('image/'):
                continue

            file_ext = os.path.splitext(image.filename)[1]
            filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(upload_dir, filename)

            contents = await image.read()
            with open(file_path, "wb") as f:
                f.write(contents)

            db.add(TourImage(
                tour_id=new_tour.id,
                image_url=f"/static/uploads/{filename}",
                is_primary=(idx == 0)
            ))

        db.commit()
        background_tasks.add_task(notify_subscribers, db, new_tour.id)
        return RedirectResponse(url="/admin/dashboard", status_code=303)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating tour: {str(e)}"
        )

@router.get('/admin/tours/edit/{tour_id}', response_class=HTMLResponse)
async def edit_tour(request: Request, tour_id: int, 
                   db: Session = Depends(get_db), 
                   user: User = Depends(get_current_admin)):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return templates.TemplateResponse("admin/edit_tour.html", {
        "request": request,
        "tour": tour,
        "images": tour.images
    })

@router.post('/admin/tours/update/{tour_id}', response_class=HTMLResponse)
async def update_tour(request: Request, tour_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access this page")
    
    form = await request.form()
    title = form.get("title")
    description = form.get("description")
    price = form.get("price")
    duration = form.get("duration")
    locations = form.get("locations")
    image_url = form.get("image_url")
    
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    
    if not tour:
        return templates.TemplateResponse("admin/edit_tour.html", {
            "request": request,
            "error": "Tour not found",
            "tour_id": tour_id
        })
    
    if title:
        tour.title = title
    if description:
        tour.description = description
    if price:
        tour.price = price
    if duration:
        tour.duration = duration
    if locations:
        tour.locations = locations
    
    db.commit()
    return RedirectResponse(url="/admin/dashboard", status_code=303)

@router.post('/admin/tours/delete/{tour_id}', response_class=HTMLResponse)
async def delete_tour(
    request: Request,
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access this page")
    
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    images = db.query(TourImage).filter(TourImage.tour_id == tour.id).all()
    for img in images:
        filename = img.image_url.split("/")[-1]
        image_path = os.path.join("static", "uploads", filename)
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception as e:
                print(f"Error deleting file {image_path}: {str(e)}")

    db.query(TourImage).filter(TourImage.tour_id == tour.id).delete()
    db.delete(tour)
    db.commit()

    return RedirectResponse(url="/admin/dashboard", status_code=303)