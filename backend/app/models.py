from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

PRICE_UNITS = ("person", "group", "tour")


def normalize_price_unit(value) -> str:
    unit = str(value or "person").strip().lower().replace("_", " ").replace("-", " ")
    unit = unit.replace("per ", "")
    aliases = {"pp": "person", "package": "tour"}
    unit = aliases.get(unit, unit)
    return unit if unit in PRICE_UNITS else "person"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    phone = Column(String(50), nullable=True)
    address = Column(String(300), nullable=True)
    bio = Column(Text, nullable=True)
    is_superadmin = Column(Boolean, default=False)
    newsletter_subscribed = Column(Boolean, default=False)
    unsubscribe_token = Column(String(36), default=lambda: str(uuid.uuid4()))
    company_name = Column(String(100), nullable=True)
    company_link = Column(String(200), nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Add OAuth fields
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    apple_id = Column(String(255), unique=True, index=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Track auth method
    auth_method = Column(String, default="email")
    
    # Relationships
    created_tours = relationship("Tour", back_populates="creator")
    bookings = relationship("Booking", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    wishlist_entries = relationship("WishlistEntry", back_populates="user")


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
    price_unit = Column(String(20), nullable=True, default="person")
    duration = Column(String(50))
    locations = Column(String(500))
    destinations = Column(String(500), nullable=True)
    accommodations = Column(String(1000), nullable=True)
    image_url = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    tour_type = Column(String(50), default="safari")
    tour_types = Column(String(200), nullable=True)
    difficulty = Column(String(500), nullable=True, default="easy")
    country = Column(String(100), nullable=False, default="Uganda")
    max_participants = Column(Integer, default=5)
    included = Column(String(1000), nullable=False)
    not_included = Column(String(1000), nullable=False)
    cancellation_policy = Column(String(500), nullable=False)
    languages = Column(String(300), nullable=True)
    live_tour_guide = Column(Boolean, default=False)
    free_cancellation = Column(Boolean, default=True)
    reserve_now_pay_later = Column(Boolean, default=False)
    itinerary = Column(Text, nullable=True)
    meeting_pickup = Column(Text, nullable=True)
    additional_information = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    images = relationship("TourImage", back_populates="tour", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="created_tours")
    bookings = relationship("Booking", back_populates="tour", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="tour", cascade="all, delete-orphan")
    wishlist_entries = relationship("WishlistEntry", back_populates="tour", cascade="all, delete-orphan")

    def calculate_price(self, adults: int, kids: int) -> float:
        price = float(self.price or 0)
        if normalize_price_unit(getattr(self, "price_unit", None)) == "person":
            return price * max(int(adults or 0) + int(kids or 0), 1)
        return price


class TourImage(Base):
    __tablename__ = "tour_images"
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"))
    image_url = Column(String(200))
    is_primary = Column(Boolean, default=False)
    
    # Relationship
    tour = relationship("Tour", back_populates="images")


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
    payment_method = Column(String(20))
    payment_id = Column(String(100))
    payment_status = Column(String)
    status = Column(String(20), default='pending')
    deleted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    donation = Column(Float, default=0.0)
    special_requirements = Column(String(500), nullable=True)
    companions = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    tour = relationship("Tour", back_populates="bookings")

    @property
    def participant_count(self):
        return self.adults + self.kids


class WishlistEntry(Base):
    __tablename__ = "wishlist_entries"
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    country = Column(String(100), nullable=True)
    preferred_date = Column(DateTime, nullable=True)
    adults = Column(Integer, default=1)
    kids = Column(Integer, default=0)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tour = relationship("Tour", back_populates="wishlist_entries")
    user = relationship("User", back_populates="wishlist_entries")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tour = relationship("Tour", back_populates="reviews")
    user = relationship("User", back_populates="reviews")