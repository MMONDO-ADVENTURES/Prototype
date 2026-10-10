from typing import List, Optional

from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str
    next: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = ""
    country: Optional[str] = "Uganda"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: Optional[str] = None


class PreferencesRequest(BaseModel):
    dietary: List[str] = Field(default_factory=list)
    pace: Optional[str] = "moderate"
    country: Optional[str] = "Uganda"
    two_factor: bool = False
    passport_expiry: Optional[str] = ""
    has_passport: bool = False


class TravellerDetail(BaseModel):
    full_name: str = ""
    role: str = "adult"
    details: str = ""


class BookingCreateRequest(BaseModel):
    tour_id: int
    adults: int = 1
    kids: int = 0
    tour_date: str
    donate: bool = False
    special_requirements: Optional[str] = None
    add_companions: bool = False
    companions: List[TravellerDetail] = Field(default_factory=list)


class BookingUpdateRequest(BaseModel):
    tour_date: Optional[str] = None
    adults: Optional[int] = None
    kids: Optional[int] = None
    special_requirements: Optional[str] = None
    add_companions: Optional[bool] = None
    companions: Optional[List[TravellerDetail]] = None


class PendingCompanionsRequest(BaseModel):
    add_companions: bool = False
    companions: List[TravellerDetail] = Field(default_factory=list)


class WishlistCreateRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    adults: int = 1
    kids: int = 0
    country: Optional[str] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None


class AdminRegisterRequest(BaseModel):
    company_name: str
    email: str
    password: str
    company_link: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None


class SuperadminCreateRequest(BaseModel):
    email: str
    password: str
    confirm_password: str
    full_name: str
    company_name: Optional[str] = None
    company_link: Optional[str] = None


class BookingStatusRequest(BaseModel):
    status: str


class BulkBookingStatusRequest(BaseModel):
    booking_ids: List[int]
    status: str


class AdminProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    bio: Optional[str] = None
