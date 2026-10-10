import bcrypt
import os
import smtplib
from dotenv import load_dotenv
from email.message import EmailMessage
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.models import User, Session, Tour, Booking
from sqlalchemy import func, or_, and_
from fastapi import Request
from app.database import get_db
from typing import Optional,List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import quote
 
#Uses the base URL from environment variable or defaults to localhost
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
base = FRONTEND_URL.rstrip('/')


SESSION_EXPIRE_MINUTES = 30
CANCELLATION_POLICY = "Free cancellation up to 3 days before the start date."
CANCELLATION_NOTICE_DAYS = 3
load_dotenv()


def booking_calendar_date(value):
    if value is None:
        return None
    if hasattr(value, "date") and callable(getattr(value, "date")):
        try:
            return value.date()
        except TypeError:
            pass
    if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
        return value
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def last_free_change_date(tour_date):
    start = booking_calendar_date(tour_date)
    if not start:
        return None
    return start - timedelta(days=CANCELLATION_NOTICE_DAYS)


def _booking_is_cancelled(booking) -> bool:
    status = str(getattr(booking, "payment_status", "") or "").lower()
    return status == "cancelled" or bool(getattr(booking, "cancelled_at", None) or getattr(booking, "deleted_at", None))


def can_cancel_booking(booking) -> bool:
    if not booking or _booking_is_cancelled(booking):
        return False
    last_day = last_free_change_date(getattr(booking, "tour_date", None))
    if not last_day:
        return False
    return datetime.today().date() <= last_day


def can_edit_booking(booking) -> bool:
    if not booking or _booking_is_cancelled(booking):
        return False
    start = booking_calendar_date(getattr(booking, "tour_date", None))
    if not start:
        return False
    return datetime.today().date() <= start

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_session(db: Session, user_id: int) -> str:
    # Delete existing sessions for the user
    db.query(Session).filter(Session.user_id == user_id).delete()
    
    # Create new session
    session = Session(
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(minutes=SESSION_EXPIRE_MINUTES)
    )
    db.add(session)
    db.commit()
    return session.id

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    session_id = request.cookies.get("auth_session_id")
    print(f"auth_Session ID from cookies: {session_id}")
    if not session_id:
        return None
    
    session = db.query(Session).filter(
        Session.id == session_id,
        Session.expires_at > datetime.utcnow()
    ).first()
    
    if not session:
        return None
    
    user = db.query(User).filter(User.id == session.user_id).first()
    print(f"Current user: {user}")
    return user

def delete_session(db: Session, session_id: str):
    db.query(Session).filter(Session.id == session_id).delete()
    db.commit()
    
def login_url(next_path: str) -> str:
    """Build a /login link that returns the visitor to next_path afterwards."""
    return f"/login?next={quote(next_path, safe='/?=&')}"


def safe_next_path(next_path: Optional[str]) -> Optional[str]:
    """
    Accept only same-site paths as a post-login destination.

    Anything absolute or protocol relative ("//evil.com") is rejected so the
    next parameter cannot be used as an open redirect.
    """
    if not next_path:
        return None
    if not next_path.startswith("/") or next_path.startswith("//"):
        return None
    return next_path


def get_user_initials(user: User) -> str:
    if user.full_name:
        names = user.full_name.split()
        initials = ''.join([name[0].upper() for name in names])
        return initials
    return ''    

async def get_current_admin(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return user

def send_email(to_email: str, subject: str, body: str,is_html: bool = False):
    #smtp_server= "smtp.gmail.com"
    #smtp_port=587
    #smtp_user= "lubegarhyan639@gmail.com"
    #smtp_password= "fycogsnvnrkqsmfw"
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "default-email@example.com")
    smtp_password = os.getenv("SMTP_PASSWORD", "default-password")

    # Email sending logic
    message = MIMEMultipart()
    message["From"] = smtp_user
    message["To"] = to_email
    message["Subject"] = subject
    #message.set_content(body)
    
    # Attach HTML or plain text body
    mime_type = "html" if is_html else "plain"
    message.attach(MIMEText(body, mime_type))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
            print(f"Email sent successfully to {to_email}")
            

        
    except Exception as e:
        print(f"Failed to send email to {to_email}. Error: {str(e)}")
        raise e  
        

async def get_authenticated_user(user: User = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def set_auth_cookie(response, session_id: str) -> None:
    response.set_cookie(
        key="auth_session_id",
        value=session_id,
        httponly=True,
        max_age=1800,
        samesite="lax",
        path="/",
    )


def clear_auth_cookie(response) -> None:
    response.delete_cookie(key="auth_session_id", path="/")

# def notify_subscribers(db:Session, tour: Tour):
#get it
#     subscribers = db.query(User).filter(User.newsletter_subscribed == True).all()
#     for subscriber in subscribers:
#         send_tour_notification(subscriber.email, tour, subscriber.unsubscribe_token)
def notify_subscribers(db: Session, tour_id: int):
    # fetch full tour object
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        return

    subscribers = db.query(User).filter(User.newsletter_subscribed == True).all()
    for subscriber in subscribers:
        send_tour_notification(subscriber.email, tour, subscriber.unsubscribe_token)


def send_tour_notification(to_email: str, tour: Tour, unsubscribe_token: str):
    #unsubscribe_link = f"http://localhost:8000/unsubscribe_newsletter?token={unsubscribe_token}"
    unsubscribe_link = f"{base}/unsubscribe_newsletter?token={unsubscribe_token}"
    tour_link = f"{base}/tours"
    subject = f"New Tour Available: {tour.title}"
    body = f"""
    <html>
    <body>
        <h1>New Tour Available!</h1>
        <p>Check out our latest tour: <strong>{tour.title}</strong></p>
        <p>{tour.description}</p>
        <p>Price: ${tour.price}</p>
        <p>Duration: {tour.duration}</p>
        <p>Destinations: {getattr(tour, "destinations", None) or tour.locations}</p>
        
        <p>Visit our website to book now!</p>
        <a href="{tour_link}" style="
           display:inline-block;
           padding:10px 20px;
           background-color:#007BFF;
           color:white;
           text-decoration:none;
           border-radius:5px;
           margin-top:10px;
        ">View Tour Details</a>
        <p style="margin-top:20px;">
            <small>
                <a href="{unsubscribe_link}" style="color:#6c757d;">Unsubscribe</a>
            </small>
        </p>
    </body>
    </html>
    """
    send_email(to_email, subject, body, is_html=True)
    
def get_dashboard_stats(db: Session):
    """Get statistics for superadmin dashboard"""
    # Total bookings
    total_bookings = db.query(func.count(Booking.id)).filter(
        Booking.deleted_at.is_(None)
    ).scalar() or 0
    
    # Total revenue (sum of all booking prices)
    total_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0)).filter(
        Booking.deleted_at.is_(None),
        Booking.payment_status == 'completed'  # Only count completed payments
    ).scalar() or 0
    
    # Total tour companies (users with company_name)
    total_companies = db.query(func.count(User.id)).filter(
        User.company_name.isnot(None),
        User.company_name != '',
        User.is_active == True
    ).scalar() or 0
    
    # Total tour operators (excluding superadmins)
    total_operators = db.query(func.count(User.id)).filter(
        User.is_admin == True,
        User.is_superadmin == False
    ).scalar() or 0
    
    # Total tours
    total_tours = db.query(func.count(Tour.id)).filter(
        Tour.is_active == True
    ).scalar() or 0
    
    # Recent bookings (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_bookings = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= week_ago,
        Booking.deleted_at.is_(None)
    ).scalar() or 0
    
    # Revenue this week
    week_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0)).filter(
        Booking.created_at >= week_ago,
        Booking.deleted_at.is_(None),
        Booking.payment_status == 'completed'
    ).scalar() or 0
    
    return {
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "total_companies": total_companies,
        "total_operators": total_operators,
        "total_tours": total_tours,
        "recent_bookings": recent_bookings,
        "week_revenue": week_revenue
    }

def get_recent_bookings(db: Session, limit: int = 10):
    """Get recent bookings with user and tour info"""
    return db.query(Booking).join(User).join(Tour).filter(
        Booking.deleted_at.is_(None)
    ).order_by(Booking.created_at.desc()).limit(limit).all()

def get_top_tours(db: Session, limit: int = 5):
    """Get most booked tours"""
    from sqlalchemy import desc
    
    return db.query(
        Tour,
        func.count(Booking.id).label('booking_count'),
        func.coalesce(func.sum(Booking.total_price), 0).label('revenue')
    ).join(Booking, Tour.id == Booking.tour_id).filter(
        Booking.deleted_at.is_(None),
        Booking.payment_status == 'completed'
    ).group_by(Tour.id).order_by(desc('booking_count')).limit(limit).all()
    
# Add this function to your utils.py (anywhere after get_current_user):

def get_current_superadmin(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency function to get current superadmin user.
    Raises HTTPException if user is not authenticated or not a superadmin.
    """
    # Get current user
    user = get_current_user(request, db)
    
    # Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Check if user is superadmin
    if not user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required"
        )
    
    return user


# Async version for async endpoints
async def get_current_superadmin_async(request: Request, db: Session = Depends(get_db)) -> User:
    """Async version of get_current_superadmin"""
    return get_current_superadmin(request, db)


# Optional: Helper function to check if user is superadmin without raising exception
def is_superadmin(user: User) -> bool:
    """Check if a user is a superadmin"""
    if not user:
        return False
    return user.is_superadmin


# Optional: Function to get all superadmins
def get_all_superadmins(db: Session) -> List[User]:
    """Get all superadmin users"""
    return db.query(User).filter(
        User.is_superadmin == True,
        User.is_active == True
    ).all()