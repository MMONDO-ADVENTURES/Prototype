import os
import stripe
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.models import User, Tour, Booking
from app.utils import get_current_user, send_email
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload = True)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
# uncomment if you are running the app on local server
# BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

#Here yo are supposed to set your codespace url
BASE_URL = os.getenv("BASE_URL")
@router.get("/payment", response_class=HTMLResponse)
async def payment_page(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    booking = request.session.get('booking')
    if not booking:
        return RedirectResponse(url="/tours", status_code=303)
    
    try:
        tour = db.query(Tour).filter(Tour.id == booking['tour_id']).first()
        if not tour:
            request.session.pop('booking', None)
            return RedirectResponse(url="/tours", status_code=303)
            
        return templates.TemplateResponse("payment.html", {
            "request": request,
            "total_price": booking["total_price"],
            "tour_title": tour.title,
            "tour_id": tour.id,
            "is_private": booking.get("tour_type") == "private",
            "base_price": tour.price,
            "paypal_client_id": os.getenv("PAYPAL_CLIENT_ID"),
            "stripe_public_key": os.getenv("STRIPE_PUBLIC_KEY"),
            "paypal_env": os.getenv("PAYPAL_MODE", "sandbox")
        })
        
    except Exception as e:
        print(f"Payment error: {str(e)}")
        return RedirectResponse(url="/tours", status_code=303)

@router.post("/create-stripe-session")
async def create_stripe_session(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        booking_data = request.session.get('booking')
        if not booking_data:
            raise HTTPException(status_code=400, detail="Booking session expired")

        tour = db.query(Tour).filter(Tour.id == booking_data["tour_id"]).first()
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        donation_amount = float(booking_data.get("donation", 0.0))
        total_price = float(booking_data["total_price"])

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(booking_data["total_price"] * 100),
                    'product_data': {
                        'name': tour.title,
                        'description': f"{booking_data['adults']} Adults, {booking_data['kids']} Kids"
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata={
                'user_id': user.id,
                'tour_id': tour.id,
                'adults': booking_data['adults'],
                'kids': booking_data['kids'],
                'total_price': str(total_price),
                'tour_date': booking_data['tour_date']
            },
            success_url=f"{BASE_URL.rstrip('/')}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{BASE_URL.rstrip('/')}/payment"
        )

        return JSONResponse({"id": session.id})

    except Exception as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment processing failed")

@router.get("/payment/success", response_class=HTMLResponse)
async def payment_success(
    request: Request,
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        new_booking = Booking(
            user_id=user.id,
            tour_id=session.metadata['tour_id'],
            adults=session.metadata['adults'],
            kids=session.metadata['kids'],
            tour_date=datetime.strptime(session.metadata['tour_date'], "%Y-%m-%d"),
            total_price=session.metadata['total_price'],
            payment_method='stripe',
            payment_id=session.payment_intent,
            payment_status='completed'
        )
        
        db.add(new_booking)
        db.commit()

        send_email(
            user.email,
            "Booking Confirmation",
            f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
                <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <tr style="background-color: #003366; color: #ffffff;">
                    <td style="padding: 20px; font-size: 18px;">
                    Booking Confirmation
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px;">
                    <p>Dear {user.full_name},</p>
                    <p>Thank you for booking with Pearl Tours! Here are your booking details:</p>
                    <ul style="padding-left: 20px;">
                        <li><strong>Tour:</strong> {new_booking.tour.title}</li>
                        <li><strong>Date:</strong> {new_booking.tour_date}</li>
                        <li><strong>Adults:</strong> {new_booking.adults}</li>
                        <li><strong>Children:</strong> {new_booking.kids}</li>
                        <li><strong>Total:</strong> ${new_booking.total_price}</li>
                        <li><strong>Payment ID:</strong> {session.payment_intent}</li>
                    </ul>
                    <p>We look forward to providing you with a wonderful experience.</p>
                    <p>Best regards,<br>
                    Pearl Tours Support Team</p>
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

        return RedirectResponse(url="/confirmation", status_code=303)

    except Exception as e:
        db.rollback()
        print(f"Payment success error: {str(e)}")
        return RedirectResponse(url="/payment-error", status_code=303)

@router.post("/complete_booking")
async def complete_booking(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        booking_data = request.session.get('booking')
        payment_data = await request.json()
        
        if not booking_data:
            raise HTTPException(400, "Booking session expired")
        
        new_booking = Booking(
            user_id=user.id,
            tour_id=booking_data["tour_id"],
            adults=booking_data["adults"],
            kids=booking_data["kids"],
            tour_date=datetime.strptime(booking_data["tour_date"], "%Y-%m-%d"),
            total_price=booking_data["total_price"],
            donation=booking_data.get('donation', 0.0),
            payment_id=payment_data["payment_id"],
            payment_status=payment_data["status"]
        )
        
        db.add(new_booking)
        db.commit()
        
        send_email(
            user.email,
            "Booking Confirmation",
            f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
                <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <tr style="background-color: #003366; color: #ffffff;">
                    <td style="padding: 20px; font-size: 18px;">
                    Booking Confirmation
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px;">
                    <p>Dear {user.full_name},</p>
                    <p>Thank you for booking with Pearl Tours! Here are your booking details:</p>
                    <ul style="padding-left: 20px;">
                        <li><strong>Tour:</strong> {new_booking.tour.title}</li>
                        <li><strong>Date:</strong> {new_booking.tour_date}</li>
                        <li><strong>Participants:</strong> {new_booking.adults} adults, {new_booking.kids} kids</li>
                        <li><strong>Total:</strong> ${new_booking.total_price}</li>
                    </ul>
                    <p>We look forward to providing you with a wonderful experience.</p>
                    <p>Best regards,<br>
                    Pearl Tours Support Team</p>
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
   
        request.session.pop('booking', None)
        return {"status": "success"}
        
    except Exception as e:
        db.rollback()
        print(f"Booking error: {str(e)}")
        raise HTTPException(500, "Booking processing failed")

@router.get("/confirmation", response_class=HTMLResponse)
async def confirmation_page(
    request: Request,
    user: User = Depends(get_current_user)
):
    return templates.TemplateResponse("confirmation.html", {
        "request": request,
        "user": user
    })