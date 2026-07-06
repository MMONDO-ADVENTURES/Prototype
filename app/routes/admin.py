import uuid
import os
import json
from fastapi import APIRouter, Request, Depends, HTTPException, Form, File, UploadFile, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, extract
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext

from app.models import User, Tour, TourImage, Booking, Review, WishlistEntry
from app.utils import get_current_admin, notify_subscribers
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)

# Password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper functions for password handling
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

@router.get('/admin/dashboard', response_class=HTMLResponse)
async def admin_dashboard(
    request: Request, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_admin)
):
    """Admin dashboard with statistics and data visualization"""
    
    # Get tours (admins see their own, superadmins see all)
    if user.is_superadmin:
        tours = db.query(Tour).options(joinedload(Tour.images)).all()
        # For superadmins, show all bookings
        total_bookings = db.query(Booking).count()
        
        # Get total revenue from confirmed bookings
        total_revenue = db.query(func.sum(Booking.total_price)).filter(
            Booking.status == 'confirmed'
        ).scalar() or 0
        
        # Get total reviews
        total_reviews = db.query(Review).count()
        
        # Get recent bookings (last 10)
        recent_bookings = db.query(Booking).options(
            joinedload(Booking.tour),
            joinedload(Booking.user)
        ).order_by(Booking.created_at.desc()).limit(10).all()
        
        # Get reviews
        reviews = db.query(Review).options(
            joinedload(Review.tour),
            joinedload(Review.user)
        ).order_by(Review.created_at.desc()).limit(10).all()
        
        # Get pending bookings count
        pending_bookings = db.query(Booking).filter(
            Booking.status == 'pending'
        ).count()
        
        # Get recent activities (simplified version)
        recent_activities = []
        
    else:
        # Regular admin - only see their own tours
        tours = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.creator_id == user.id).all()
        
        # Get bookings for this operator's tours
        total_bookings = db.query(Booking).join(Tour).filter(Tour.creator_id == user.id).count()
        
        # Calculate total revenue
        total_revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
            Tour.creator_id == user.id,
            Booking.status == 'confirmed'
        ).scalar() or 0
        
        # Get reviews for this operator's tours
        total_reviews = db.query(Review).join(Tour).filter(Tour.creator_id == user.id).count()
        
        # Get recent bookings for this operator
        recent_bookings = db.query(Booking).join(Tour).filter(
            Tour.creator_id == user.id
        ).options(
            joinedload(Booking.tour),
            joinedload(Booking.user)
        ).order_by(Booking.created_at.desc()).limit(10).all()
        
        # Get reviews for this operator
        reviews = db.query(Review).join(Tour).filter(
            Tour.creator_id == user.id
        ).options(
            joinedload(Review.tour),
            joinedload(Review.user)
        ).order_by(Review.created_at.desc()).limit(10).all()
        
        # Get pending bookings count
        pending_bookings = db.query(Booking).join(Tour).filter(
            Tour.creator_id == user.id,
            Booking.status == 'pending'
        ).count()
        
        # Get recent activities (simplified version)
        recent_activities = []
    
    # Calculate statistics
    total_tours = len(tours)
    
    # Get top tours by revenue (simplified)
    top_tours_data = []
    if user.is_superadmin:
        tour_revenues = db.query(
            Tour,
            func.sum(Booking.total_price).label('revenue')
        ).outerjoin(Booking).filter(
            Booking.status == 'confirmed'
        ).group_by(Tour.id).order_by(desc('revenue')).limit(5).all()
        
        for tour, revenue in tour_revenues:
            top_tours_data.append({
                'title': tour.title,
                'revenue': revenue or 0,
                'image': tour.images[0].image_url if tour.images else None
            })
    else:
        tour_revenues = db.query(
            Tour,
            func.sum(Booking.total_price).label('revenue')
        ).outerjoin(Booking).filter(
            Tour.creator_id == user.id,
            Booking.status == 'confirmed'
        ).group_by(Tour.id).order_by(desc('revenue')).limit(5).all()
        
        for tour, revenue in tour_revenues:
            top_tours_data.append({
                'title': tour.title,
                'revenue': revenue or 0,
                'image': tour.images[0].image_url if tour.images else None
            })
    
    # Calculate average rating
    if user.is_superadmin:
        avg_rating = db.query(func.avg(Review.rating)).scalar() or 4.5
    else:
        avg_rating = db.query(func.avg(Review.rating)).join(Tour).filter(
            Tour.creator_id == user.id
        ).scalar() or 4.5
    
    # Calculate rating distribution
    rating_distribution = {}
    for i in range(1, 6):
        if user.is_superadmin:
            count = db.query(Review).filter(Review.rating == i).count()
        else:
            count = db.query(Review).join(Tour).filter(
                Tour.creator_id == user.id,
                Review.rating == i
            ).count()
        rating_distribution[i] = count
    
    return templates.TemplateResponse("admin/dashboard.html", {
        "request": request,
        "user": user,
        "tours": tours,
        "total_tours": total_tours,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "total_reviews": total_reviews,
        "pending_bookings_count": pending_bookings,
        "bookings": recent_bookings,
        "reviews": reviews,
        "top_tours": top_tours_data,
        "recent_activities": recent_activities,
        "average_rating": round(float(avg_rating), 1),
        "rating_distribution": rating_distribution,
    })

@router.post('/admin/tours/create', response_class=HTMLResponse)
async def create_tour(
    request: Request,
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    duration_value: str = Form(...),
    duration_unit: str = Form(...),
    locations: str = Form(...),  # Now includes location information
    difficulty: str = Form('Easy'),
    country: str = Form(...),
    tour_type: str = Form('safari'),  # Now includes category information
    max_participants: int = Form(20),
    included: str = Form(None),
    not_included: str = Form(None),
    cancellation_policy: str = Form('50% Refund'),
    images: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    try:
        # Combine duration
        duration = f"{duration_value} {duration_unit}"
        
        new_tour = Tour(
            title=title,
            description=description,
            price=price,
            duration=duration,
            locations=locations,  # Contains location information
            difficulty=difficulty,
            tour_type=tour_type,  # Contains category information
            country=country,
            max_participants=max_participants,
            included=included,
            not_included=not_included,
            cancellation_policy=cancellation_policy,
            creator_id=user.id,
            is_active=True
        )
        db.add(new_tour)
        db.flush()

        # Handle images if provided
        if images:
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
        
        if user.is_superadmin:
            background_tasks.add_task(notify_subscribers, db, new_tour.id)
        
        # Set success message in session
        request.session['success'] = "Tour created successfully"
        return RedirectResponse(url="/admin/dashboard", status_code=303)

    except Exception as e:
        db.rollback()
        request.session['error'] = f"Error creating tour: {str(e)}"
        return RedirectResponse(url="/admin/dashboard", status_code=303)

@router.get('/admin/tours/get/{tour_id}')
async def get_tour(
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get tour data for editing"""
    try:
        tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
        
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Parse duration
        duration_parts = tour.duration.split(' ') if tour.duration else ['6', 'days']
        
        return {
            'id': tour.id,
            'title': tour.title,
            'description': tour.description,
            'price': tour.price,
            'duration': tour.duration,
            'locations': tour.locations,  # Contains location information
            'difficulty': tour.difficulty,
            'country': tour.country,
            'tour_type': tour.tour_type,  # Contains category information
            'max_participants': tour.max_participants,
            'included': tour.included,
            'not_included': tour.not_included,
            'cancellation_policy': tour.cancellation_policy,
            'is_active': tour.is_active,
            'images': [{'id': img.id, 'image_url': img.image_url} for img in tour.images]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tour: {str(e)}")

@router.post('/admin/tours/update/{tour_id}', response_class=HTMLResponse)
async def update_tour(
    request: Request,
    background_tasks: BackgroundTasks,
    tour_id: int,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    duration_value: str = Form(...),
    duration_unit: str = Form(...),
    locations: str = Form(...),  # Contains location information
    difficulty: str = Form('Easy'),
    country: str = Form(...),
    tour_type: str = Form('safari'),  # Contains category information
    max_participants: int = Form(20),
    included: str = Form(None),
    not_included: str = Form(None),
    cancellation_policy: str = Form('50% Refund'),
    is_active: bool = Form(True),
    existing_images: List[str] = Form([]),  # List of image IDs to keep
    images: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    
    try:
        tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
        
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update tour fields
        tour.title = title
        tour.description = description
        tour.price = price
        tour.duration = f"{duration_value} {duration_unit}"
        tour.locations = locations  # Contains location information
        tour.difficulty = difficulty
        tour.country = country
        tour.tour_type = tour_type  # Contains category information
        tour.max_participants = max_participants
        tour.included = included
        tour.not_included = not_included
        tour.cancellation_policy = cancellation_policy
        tour.is_active = is_active
        tour.updated_at = datetime.utcnow()
        
        # Handle existing images - remove those not in existing_images list
        if existing_images:
            existing_image_ids = [int(img_id) for img_id in existing_images if img_id]
            images_to_remove = db.query(TourImage).filter(
                TourImage.tour_id == tour.id,
                TourImage.id.notin_(existing_image_ids)
            ).all()
            
            for img in images_to_remove:
                # Delete file from disk
                filename = img.image_url.split("/")[-1]
                image_path = os.path.join("static", "uploads", filename)
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except:
                        pass
                db.delete(img)
        
        # Add new images
        if images:
            upload_dir = "static/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            
            for image in images:
                if not image.content_type.startswith('image/'):
                    continue
                
                file_ext = os.path.splitext(image.filename)[1]
                filename = f"{uuid.uuid4()}{file_ext}"
                file_path = os.path.join(upload_dir, filename)
                
                contents = await image.read()
                with open(file_path, "wb") as f:
                    f.write(contents)
                
                # Check if we have any primary images left
                has_primary = db.query(TourImage).filter(
                    TourImage.tour_id == tour.id,
                    TourImage.is_primary == True
                ).count() > 0
                
                db.add(TourImage(
                    tour_id=tour.id,
                    image_url=f"/static/uploads/{filename}",
                    is_primary=not has_primary  # Set as primary if no primary exists
                ))
        
        db.commit()
        
        # Set success message
        request.session['success'] = "Tour updated successfully"
        return RedirectResponse(url="/admin/dashboard", status_code=303)
        
    except Exception as e:
        db.rollback()
        request.session['error'] = f"Error updating tour: {str(e)}"
        return RedirectResponse(url="/admin/dashboard", status_code=303)

@router.post('/admin/tours/delete/{tour_id}', response_class=HTMLResponse)
async def delete_tour(
    request: Request,
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    try:
        tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
        if not tour:
            request.session['error'] = "Tour not found"
            return RedirectResponse(url="/admin/dashboard", status_code=303)
        
        if not user.is_superadmin and tour.creator_id != user.id:
            request.session['error'] = "You can only delete tours you created"
            return RedirectResponse(url="/admin/dashboard", status_code=303)
        
        # Delete associated images from disk
        for img in tour.images:
            filename = img.image_url.split("/")[-1]
            image_path = os.path.join("static", "uploads", filename)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Error deleting file {image_path}: {str(e)}")
        
        db.delete(tour)
        db.commit()
        
        request.session['success'] = "Tour deleted successfully"
        return RedirectResponse(url="/admin/dashboard", status_code=303)
    
    except Exception as e:
        db.rollback()
        request.session['error'] = f"Error deleting tour: {str(e)}"
        return RedirectResponse(url="/admin/dashboard", status_code=303)

@router.post('/admin/bookings/{booking_id}/status')
async def update_booking_status(
    booking_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Update booking status (confirm, decline, cancel)"""
    try:
        data = await request.json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'confirmed', 'declined', 'cancelled']:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if user has permission
        tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update status and timestamps
        booking.status = new_status
        if new_status == 'cancelled':
            booking.cancelled_at = datetime.utcnow()
        elif new_status == 'confirmed':
            booking.confirmed_at = datetime.utcnow()
        
        booking.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"success": True, "message": f"Booking status updated to {new_status}"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating booking status: {str(e)}")

@router.post('/admin/bookings/bulk-status')
async def bulk_update_booking_status(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Bulk update booking statuses"""
    try:
        data = await request.json()
        booking_ids = data.get('booking_ids', [])
        new_status = data.get('status')
        
        if new_status not in ['pending', 'confirmed', 'declined', 'cancelled']:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        if not booking_ids:
            raise HTTPException(status_code=400, detail="No bookings selected")
        
        # Get bookings
        if user.is_superadmin:
            bookings = db.query(Booking).filter(Booking.id.in_(booking_ids)).all()
        else:
            bookings = db.query(Booking).join(Tour).filter(
                Booking.id.in_(booking_ids),
                Tour.creator_id == user.id
            ).all()
        
        if not bookings:
            raise HTTPException(status_code=404, detail="No valid bookings found")
        
        # Update each booking
        now = datetime.utcnow()
        for booking in bookings:
            booking.status = new_status
            booking.updated_at = now
            if new_status == 'cancelled':
                booking.cancelled_at = now
            elif new_status == 'confirmed':
                booking.confirmed_at = now
        
        db.commit()
        
        return {
            "success": True, 
            "message": f"Updated {len(bookings)} booking(s) to {new_status}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating bookings: {str(e)}")

@router.post('/admin/profile/update', response_class=HTMLResponse)
async def update_profile(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Update admin profile information"""
    try:
        form = await request.form()
        
        # Update user fields
        if full_name := form.get('full_name'):
            user.full_name = full_name
        
        if email := form.get('email'):
            # Check if email is already taken by another user
            existing_user = db.query(User).filter(User.email == email, User.id != user.id).first()
            if existing_user:
                # Store error in session for display
                request.session['error'] = "Email already in use"
                return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
            user.email = email
        
        if phone := form.get('phone'):
            user.phone = phone
        
        if company_name := form.get('company_name'):
            user.company_name = company_name
        
        if bio := form.get('bio'):
            user.bio = bio
        
        db.commit()
        
        # Set success message in session
        request.session['success'] = "Profile updated successfully"
        return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
    
    except Exception as e:
        request.session['error'] = f"Error updating profile: {str(e)}"
        return RedirectResponse(url="/admin/dashboard#profile", status_code=303)

@router.post('/admin/profile/upload-picture')
async def upload_profile_picture(
    request: Request,
    picture: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Upload and update profile picture"""
    try:
        if not picture.content_type.startswith('image/'):
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "File must be an image"}
            )
        
        # Create upload directory
        upload_dir = "static/uploads/profile_pictures"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(picture.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        contents = await picture.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Delete old profile picture if exists
        if user.picture:
            old_filename = user.picture.split("/")[-1]
            old_path = os.path.join(upload_dir, old_filename)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except:
                    pass
        
        # Update user record
        user.picture = f"/static/uploads/profile_pictures/{filename}"
        db.commit()
        
        return {
            "success": True,
            "message": "Profile picture updated successfully",
            "picture_url": user.picture
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@router.post('/admin/profile/change-password', response_class=HTMLResponse)
async def change_password(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Change admin password"""
    try:
        form = await request.form()
        
        current_password = form.get('current_password')
        new_password = form.get('new_password')
        confirm_password = form.get('confirm_password')
        
        # Validate inputs
        if not current_password or not new_password or not confirm_password:
            request.session['error'] = "All password fields are required"
            return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
        
        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            request.session['error'] = "Current password is incorrect"
            return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
        
        # Check password strength (optional)
        if len(new_password) < 8:
            request.session['error'] = "New password must be at least 8 characters long"
            return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
        
        if new_password != confirm_password:
            request.session['error'] = "New passwords do not match"
            return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
        
        # Update password
        user.hashed_password = hash_password(new_password)
        db.commit()
        
        # Set success message
        request.session['success'] = "Password changed successfully"
        return RedirectResponse(url="/admin/dashboard#profile", status_code=303)
    
    except Exception as e:
        request.session['error'] = f"Error changing password: {str(e)}"
        return RedirectResponse(url="/admin/dashboard#profile", status_code=303)

@router.post('/admin/reviews/{review_id}/verify')
async def verify_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Verify a review"""
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Check permission
        tour = db.query(Tour).filter(Tour.id == review.tour_id).first()
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        review.is_verified = True
        review.verified_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "Review verified successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying review: {str(e)}")

@router.delete('/admin/reviews/{review_id}')
async def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Delete a review"""
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Check permission
        tour = db.query(Tour).filter(Tour.id == review.tour_id).first()
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        db.delete(review)
        db.commit()
        
        return {"success": True, "message": "Review deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting review: {str(e)}")

@router.get('/admin/bookings')
async def get_all_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get all bookings with filtering"""
    try:
        if user.is_superadmin:
            bookings = db.query(Booking).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).all()
        else:
            bookings = db.query(Booking).join(Tour).filter(
                Tour.creator_id == user.id
            ).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).all()
        
        # Convert to serializable format
        bookings_data = []
        for booking in bookings:
            bookings_data.append({
                'id': booking.id,
                'tour': {
                    'id': booking.tour.id if booking.tour else None,
                    'title': booking.tour.title if booking.tour else None,
                    'images': [img.image_url for img in booking.tour.images] if booking.tour and booking.tour.images else []
                },
                'user': {
                    'id': booking.user.id if booking.user else None,
                    'full_name': booking.user.full_name if booking.user else None,
                    'email': booking.user.email if booking.user else None,
                },
                'tour_date': booking.tour_date.isoformat() if booking.tour_date else None,
                'adults': booking.adults,
                'kids': booking.kids,
                'total_price': booking.total_price,
                'status': booking.status,
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
            })
        
        return bookings_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bookings: {str(e)}")

@router.get('/admin/revenue/analytics')
async def get_revenue_analytics(
    period: str = "monthly",  # monthly, quarterly, yearly
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get revenue analytics data"""
    try:
        current_date = datetime.utcnow()
        
        if period == "monthly":
            # Get last 12 months
            labels = []
            data = []
            
            for i in range(11, -1, -1):
                month_date = current_date - timedelta(days=30*i)
                month_key = month_date.strftime("%b %Y")
                labels.append(month_key)
                
                # Calculate revenue for this month
                if user.is_superadmin:
                    revenue = db.query(func.sum(Booking.total_price)).filter(
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == month_date.year,
                        extract('month', Booking.created_at) == month_date.month
                    ).scalar() or 0
                else:
                    revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                        Tour.creator_id == user.id,
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == month_date.year,
                        extract('month', Booking.created_at) == month_date.month
                    ).scalar() or 0
                
                data.append(float(revenue))
        
        elif period == "quarterly":
            # Get last 4 quarters
            labels = []
            data = []
            
            for i in range(3, -1, -1):
                quarter_date = current_date - timedelta(days=90*i)
                quarter_num = (quarter_date.month - 1) // 3 + 1
                quarter_key = f"Q{quarter_num} {quarter_date.year}"
                labels.append(quarter_key)
                
                # Calculate revenue for this quarter
                start_month = (quarter_num - 1) * 3 + 1
                end_month = start_month + 2
                
                if user.is_superadmin:
                    revenue = db.query(func.sum(Booking.total_price)).filter(
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == quarter_date.year,
                        extract('month', Booking.created_at) >= start_month,
                        extract('month', Booking.created_at) <= end_month
                    ).scalar() or 0
                else:
                    revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                        Tour.creator_id == user.id,
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == quarter_date.year,
                        extract('month', Booking.created_at) >= start_month,
                        extract('month', Booking.created_at) <= end_month
                    ).scalar() or 0
                
                data.append(float(revenue))
        
        else:  # yearly
            # Get last 5 years
            labels = []
            data = []
            
            for i in range(4, -1, -1):
                year = current_date.year - i
                labels.append(str(year))
                
                if user.is_superadmin:
                    revenue = db.query(func.sum(Booking.total_price)).filter(
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == year
                    ).scalar() or 0
                else:
                    revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                        Tour.creator_id == user.id,
                        Booking.status == 'confirmed',
                        extract('year', Booking.created_at) == year
                    ).scalar() or 0
                
                data.append(float(revenue))
        
        return {
            "period": period,
            "labels": labels,
            "data": data,
            "last_12_months": dict(zip(labels, data)) if period == "monthly" else {},
            "quarterly": dict(zip(labels, data)) if period == "quarterly" else {},
            "yearly": dict(zip(labels, data)) if period == "yearly" else {}
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating revenue analytics: {str(e)}")

@router.get('/admin/stats/overview')
async def get_stats_overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get overview statistics for dashboard"""
    try:
        # Get counts
        if user.is_superadmin:
            total_tours = db.query(Tour).count()
            total_bookings = db.query(Booking).count()
            total_reviews = db.query(Review).count()
            pending_bookings = db.query(Booking).filter(Booking.status == 'pending').count()
            confirmed_bookings = db.query(Booking).filter(Booking.status == 'confirmed').count()
            total_revenue = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == 'confirmed'
            ).scalar() or 0
        else:
            total_tours = db.query(Tour).filter(Tour.creator_id == user.id).count()
            total_bookings = db.query(Booking).join(Tour).filter(Tour.creator_id == user.id).count()
            total_reviews = db.query(Review).join(Tour).filter(Tour.creator_id == user.id).count()
            pending_bookings = db.query(Booking).join(Tour).filter(
                Tour.creator_id == user.id,
                Booking.status == 'pending'
            ).count()
            confirmed_bookings = db.query(Booking).join(Tour).filter(
                Tour.creator_id == user.id,
                Booking.status == 'confirmed'
            ).count()
            total_revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                Tour.creator_id == user.id,
                Booking.status == 'confirmed'
            ).scalar() or 0
        
        # Calculate month-over-month growth
        current_month = datetime.utcnow().strftime("%Y-%m")
        last_month_date = (datetime.utcnow().replace(day=1) - timedelta(days=1))
        last_month = last_month_date.strftime("%Y-%m")
        
        if user.is_superadmin:
            current_month_revenue = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == 'confirmed',
                func.strftime("%Y-%m", Booking.created_at) == current_month
            ).scalar() or 0
            
            last_month_revenue = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == 'confirmed',
                func.strftime("%Y-%m", Booking.created_at) == last_month
            ).scalar() or 0
        else:
            current_month_revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                Tour.creator_id == user.id,
                Booking.status == 'confirmed',
                func.strftime("%Y-%m", Booking.created_at) == current_month
            ).scalar() or 0
            
            last_month_revenue = db.query(func.sum(Booking.total_price)).join(Tour).filter(
                Tour.creator_id == user.id,
                Booking.status == 'confirmed',
                func.strftime("%Y-%m", Booking.created_at) == last_month
            ).scalar() or 0
        
        # Calculate growth percentage
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = ((current_month_revenue - last_month_revenue) / last_month_revenue * 100)
        
        # Calculate average booking value
        average_booking_value = 0
        if confirmed_bookings > 0:
            average_booking_value = total_revenue / confirmed_bookings
        
        return {
            "success": True,
            "total_tours": total_tours,
            "total_bookings": total_bookings,
            "total_reviews": total_reviews,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "total_revenue": float(total_revenue),
            "current_month_revenue": float(current_month_revenue),
            "last_month_revenue": float(last_month_revenue),
            "revenue_growth": round(revenue_growth, 2),
            "average_booking_value": round(average_booking_value, 2)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "total_tours": 0,
            "total_bookings": 0,
            "total_reviews": 0,
            "pending_bookings": 0,
            "confirmed_bookings": 0,
            "total_revenue": 0,
            "current_month_revenue": 0,
            "last_month_revenue": 0,
            "revenue_growth": 0,
            "average_booking_value": 0
        }

@router.get('/admin/recent/activities')
async def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get recent activities for dashboard"""
    try:
        activities = []
        now = datetime.utcnow()
        
        # Helper function to format time
        def format_time(dt):
            diff = now - dt
            if diff.days > 30:
                return f"{diff.days // 30} months ago"
            elif diff.days > 0:
                return f"{diff.days} days ago"
            elif diff.seconds > 3600:
                return f"{diff.seconds // 3600} hours ago"
            elif diff.seconds > 60:
                return f"{diff.seconds // 60} minutes ago"
            else:
                return "Just now"
        
        # Get recent bookings
        if user.is_superadmin:
            recent_bookings = db.query(Booking).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).limit(limit).all()
        else:
            recent_bookings = db.query(Booking).join(Tour).filter(
                Tour.creator_id == user.id
            ).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).limit(limit).all()
        
        for booking in recent_bookings:
            activities.append({
                'type': 'booking',
                'title': f'New Booking #{booking.id}',
                'description': f'{booking.user.full_name if booking.user else "Customer"} booked "{booking.tour.title[:30] if booking.tour else "Tour"}..."',
                'time': format_time(booking.created_at),
                'icon': 'calendar-check'
            })
        
        # Get recent reviews
        if user.is_superadmin:
            recent_reviews = db.query(Review).options(
                joinedload(Review.tour),
                joinedload(Review.user)
            ).order_by(Review.created_at.desc()).limit(limit).all()
        else:
            recent_reviews = db.query(Review).join(Tour).filter(
                Tour.creator_id == user.id
            ).options(
                joinedload(Review.tour),
                joinedload(Review.user)
            ).order_by(Review.created_at.desc()).limit(limit).all()
        
        for review in recent_reviews:
            activities.append({
                'type': 'review',
                'title': f'New Review ({review.rating}★)',
                'description': f'{review.user.full_name if review.user else "User"} reviewed "{review.tour.title[:30] if review.tour else "Tour"}..."',
                'time': format_time(review.created_at),
                'icon': 'star'
            })
        
        # Sort by time and limit
        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:limit]
        
        return activities
    
    except Exception as e:
        return []

@router.get('/admin/booking/{booking_id}/details')
async def get_booking_details(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Get detailed booking information"""
    try:
        booking = db.query(Booking).options(
            joinedload(Booking.tour).joinedload(Tour.images),
            joinedload(Booking.user)
        ).filter(Booking.id == booking_id).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check permission
        tour = booking.tour
        if not user.is_superadmin and tour.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        booking_details = {
            'id': booking.id,
            'tour': {
                'id': tour.id,
                'title': tour.title,
                'price': tour.price,
                'duration': tour.duration,
                'country': tour.country,
                'image': tour.images[0].image_url if tour.images else None
            },
            'customer': {
                'id': booking.user.id,
                'name': booking.user.full_name,
                'email': booking.user.email,
                'phone': booking.user.phone
            },
            'booking_details': {
                'adults': booking.adults,
                'kids': booking.kids,
                'tour_date': booking.tour_date.isoformat() if booking.tour_date else None,
                'total_price': booking.total_price,
                'status': booking.status,
                'payment_method': booking.payment_method,
                'payment_status': booking.payment_status,
                'special_requirements': booking.special_requirements,
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
                'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None
            }
        }
        
        return booking_details
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching booking details: {str(e)}")

@router.get('/admin/bookings/export')
async def export_bookings(
    format: str = "csv",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Export bookings to CSV or JSON"""
    try:
        # Get bookings based on user role
        if user.is_superadmin:
            bookings = db.query(Booking).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).all()
        else:
            bookings = db.query(Booking).join(Tour).filter(
                Tour.creator_id == user.id
            ).options(
                joinedload(Booking.tour),
                joinedload(Booking.user)
            ).order_by(Booking.created_at.desc()).all()
        
        # Prepare data
        export_data = []
        for booking in bookings:
            export_data.append({
                'Booking ID': booking.id,
                'Tour': booking.tour.title if booking.tour else 'N/A',
                'Customer': booking.user.full_name if booking.user else 'N/A',
                'Email': booking.user.email if booking.user else 'N/A',
                'Tour Date': booking.tour_date.isoformat() if booking.tour_date else 'N/A',
                'Adults': booking.adults,
                'Kids': booking.kids,
                'Total Price': booking.total_price,
                'Status': booking.status,
                'Payment Method': booking.payment_method,
                'Payment Status': booking.payment_status,
                'Created At': booking.created_at.isoformat() if booking.created_at else 'N/A'
            })
        
        if format.lower() == 'json':
            return JSONResponse(
                content=export_data,
                media_type="application/json"
            )
        else:
            # Convert to CSV
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
            writer.writeheader()
            writer.writerows(export_data)
            
            return JSONResponse(
                content={"csv": output.getvalue()},
                media_type="application/json"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting bookings: {str(e)}")

@router.get('/admin/revenue/export')
async def export_revenue_report(
    period: str = "monthly",
    format: str = "json",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin)
):
    """Export revenue report"""
    try:
        # Get revenue data
        analytics = await get_revenue_analytics(period, db, user)
        
        if format.lower() == 'json':
            return JSONResponse(
                content=analytics,
                media_type="application/json"
            )
        else:
            # For PDF, you would typically use a PDF generation library
            # This is a simplified version returning JSON
            return JSONResponse(
                content={
                    "message": "PDF export not implemented",
                    "data": analytics
                },
                media_type="application/json"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting revenue report: {str(e)}")


@router.get('/admin/wishlist', response_class=HTMLResponse)
async def admin_wishlist(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    entries = (
        db.query(WishlistEntry)
        .options(joinedload(WishlistEntry.tour))
        .order_by(WishlistEntry.created_at.desc())
        .all()
    )

    tour_counts = (
        db.query(Tour.title, func.count(WishlistEntry.id))
        .join(WishlistEntry, Tour.id == WishlistEntry.tour_id)
        .group_by(Tour.id, Tour.title)
        .order_by(func.count(WishlistEntry.id).desc())
        .all()
    )

    return templates.TemplateResponse(
        "admin/wishlist.html",
        {
            "request": request,
            "user": user,
            "entries": entries,
            "tour_counts": tour_counts,
            "total_interest": len(entries),
        },
    )