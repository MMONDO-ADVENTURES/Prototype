from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional
from app.models import User, Tour, Booking
from app.utils import get_current_user, send_email
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)

@router.get("/book/{tour_id}", response_class=HTMLResponse)
async def book_tour(
    request: Request,
    tour_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        return RedirectResponse(url="/tours", status_code=303)

    today = datetime.now().date().isoformat()
    return templates.TemplateResponse("booking.html", {
        "request": request,
        "tour": tour,
        "user": user,
        "today": today
    })

@router.post("/process_booking", response_class=HTMLResponse)
async def process_booking(
    request: Request,
    tour_id: int = Form(...),
    adults: int = Form(...),
    kids: int = Form(...),
    tour_date: str = Form(...),
    donate: Optional[str] = Form(None),
    tour_type: str = Form('normal'),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        if adults < 1:
            raise HTTPException(status_code=400, detail="At least 1 adult required")
        
        if kids < 0:
            raise HTTPException(status_code=400, detail="Invalid number of kids")

        tour = db.query(Tour).filter(Tour.id == tour_id).first()
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")

        try:
            tour_date_obj = datetime.strptime(tour_date, "%Y-%m-%d").date()
            if tour_date_obj < datetime.today().date():
                raise ValueError("Date in past")
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid tour date") from e

        total_price = (adults + kids) * tour.price
        
        if tour_type == 'private':
            total_price *= 1.35
            request.session['tour_type'] = 'private'
        else:
            request.session['tour_type'] = 'normal'
          
        donation_amount = 10.0 if donate else 0.0
        total_price += donation_amount

        request.session['booking'] = {
            "tour_id": tour_id,
            "adults": adults,
            "kids": kids,
            "tour_date": tour_date,
            "donation": donation_amount,
            "total_price": float(total_price)
        }

        return RedirectResponse(url="/payment", status_code=303)

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Booking processing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your booking"
        )

@router.get("/my-bookings", response_class=HTMLResponse)
async def my_bookings(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not user:
        return RedirectResponse(url="/login")

    one_month_ago = datetime.utcnow() - timedelta(days=30)
    
    bookings = db.query(Booking).filter(
        Booking.user_id == user.id,
        Booking.deleted_at.is_(None),
        or_(
            Booking.payment_status != 'cancelled',
            and_(
                Booking.payment_status == 'cancelled',
                Booking.cancelled_at >= one_month_ago
            )
        )
    ).all()
    
    current_datetime = datetime.utcnow()
    
    return templates.TemplateResponse("my_bookings.html", {
        "request": request,
        "bookings": bookings,
        "current_datetime": current_datetime,
        "title": "My Bookings",
        "user": user
    })

@router.post("/cancel-booking/{booking_id}", response_class=RedirectResponse)
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    cancellation_deadline = booking.tour_date - timedelta(hours=24)
    if datetime.utcnow() > cancellation_deadline:
        return templates.TemplateResponse("cancellation_error.html", {
            "request": Request,
            "error": "Cancellation is only allowed up to 24 hours before the tour"
        })
    
    booking.payment_status = "cancelled"
    booking.cancelled_at = datetime.utcnow() 
    db.commit()
    
    send_email(
        user.email,
        "Booking Cancellation Confirmation",
        f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <tr style="background-color: #003366; color: #ffffff;">
                <td style="padding: 20px; font-size: 18px;">
                  Booking Cancellation Confirmation
                </td>
              </tr>
              <tr>
                <td style="padding: 20px;">
                  <p>Dear {user.full_name},</p>
                  <p>We regret to inform you that your booking for <strong>{booking.tour.title}</strong> on <strong>{booking.tour_date}</strong> has been cancelled.</p>
                  <p>A refund will be processed to your original payment method within 3–5 business days.</p>
                  <p>We apologize for any inconvenience this may have caused and thank you for choosing Pearl Tours.</p>
                  <p>Best regards,<br>Pearl Tours Support Team</p>
                </td>
              </tr>
              <tr style="background-color: #f0f0f0; text-align: center;">
                <td style="padding: 10px; font-size: 12px; color: #777;">
                  &copy; {datetime.now().year} Pearl Tours. All rights reserved.
                </td>
              </tr>
            </table>
          </body>
        </html>
        """, is_html=True
    )
    
    return RedirectResponse(url="/my-bookings", status_code=303)

@router.post("/delete-booking/{booking_id}", response_class=RedirectResponse)
async def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == user.id,
        Booking.payment_status == 'cancelled',
        Booking.deleted_at.is_(None)
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.deleted_at = datetime.utcnow()
    db.commit()
    
    return RedirectResponse(url="/my-bookings", status_code=303)