from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime, timedelta

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    # In models.py, add to the User class:
    is_superadmin = Column(Boolean, default=False)
    newsletter_subscribed = Column(Boolean, default=False)
    unsubscribe_token=Column(String(36), default=lambda:str(uuid.uuid4()))
    company_name = Column(String(100), nullable=True)
    company_link = Column(String(200), nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Add OAuth fields by oscar
    google_id = Column(String, unique=True, index=True, nullable=True)
    apple_id = Column(String, unique=True, index=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Track auth method by oscar
    auth_method = Column(String, default="email")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, index=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class Tour(Base):
    __tablename__ = "tours"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True)
    description = Column(String(500))
    price = Column(Float)
    duration = Column(String(50))
    locations = Column(String(100))
    image_url = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    images = relationship("TourImage", backref="tour", cascade="all, delete-orphan")

    tour_type = Column(String(50), default='normal')
    risk = Column(String(500), nullable=True)
    country = Column(String(100), nullable=False)
    max_participants = Column(Integer, default=20)
    included = Column(String(1000), nullable=False)
    not_included = Column(String(1000), nullable=False)
    cancellation_policy = Column(String(500), nullable=False)

    def calculate_price(self, adults: int, kids: int, is_private: bool = False) -> float:
        base_price = (adults + kids) * self.price
        return base_price * 1.35 if is_private else base_price


class TourImage(Base):
    __tablename__ = "tour_images"
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"))
    image_url = Column(String(200))
    is_primary = Column(Boolean, default=False)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tour_id = Column(Integer, ForeignKey("tours.id"))
    adults = Column(Integer)
    kids = Column(Integer)
    tour_date = Column(DateTime)
    total_price = Column(Float)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", backref="bookings")
    tour = relationship("Tour", backref="bookings")
    payment_method = Column(String(20))
    payment_id = Column(String(50))
    payment_status = Column(String)
    deleted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    donation = Column(Float, default=0.0)
    special_requirements = Column(String(500), nullable=True)

    @property
    def participant_count(self):
        return self.adults + self.kids
    # ======================================================
# ============ Added by Bammez (CULTURE SYSTEM) ============
# ======================================================

class Country(Base):
    """
    Stores East African culture information for the Mmondo Adventures
    cultural bank page.

    This is NOT for tours, but for culture display:
    Uganda, Kenya, Tanzania, Rwanda, Burundi, South Sudan, etc.
    """

    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)

    # Slug for urls like: /cultures#uganda
    slug = Column(String(50), unique=True, index=True)

    # Country name (Uganda, Kenya, Tanzania...)
    name = Column(String(100), nullable=False)

    # Country description (NEW FIELD)
    description = Column(String(1000), nullable=True)  # <-- ADD THIS LINE

    # Culture content
    food = Column(String(1000), nullable=True)
    dress = Column(String(1000), nullable=True)
    traditions = Column(String(1500), nullable=True)
    tour_themes = Column(String(1000), nullable=True)

    # YouTube video link (admin can change it anytime)
    video_url = Column(String(300), nullable=True)
    video_credit = Column(String(200), nullable=True)

    # Optional testimonial about the culture
    testimonial = Column(String(1500), nullable=True)

    # For badge display on UI
    badge_label = Column(String(50), nullable=True)
    badge_color = Column(String(50), nullable=True)

    # ===== Added by Bammez: relationship to culture images =====
    images = relationship(
        "CountryImage",               # model name defined below
        backref="country",            # access: image.country
        cascade="all, delete-orphan"  # delete images when country is deleted
    )
    # ===== CountryImage for culture gallery =====
# ===== CountryImage for culture gallery =====
class CountryImage(Base):
    """
    Image table for countries on the culture page.
    Stores image URL + optional alt text.
    """

    __tablename__ = "country_images"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), index=True)

    # URL to image file (e.g. /static/uploads/uganda1.jpg)
    image_url = Column(String(300), nullable=False)

    # Optional alt text for accessibility
    alt_text = Column(String(200), nullable=True)

    # Mark the main/hero image if you want
    is_primary = Column(Boolean, default=False)
    
    # Optional: Store filename and filepath for easier file management
    filename = Column(String(200), nullable=True)
    filepath = Column(String(500), nullable=True)