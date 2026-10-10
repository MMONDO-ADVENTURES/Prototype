import csv
import io
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from sqlalchemy import desc, extract, func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Booking, Review, Tour, TourImage, User, WishlistEntry, normalize_price_unit
from app.paths import disk_from_static_url, static_file
from app.schemas import AdminProfileUpdateRequest, BookingStatusRequest, BulkBookingStatusRequest, ChangePasswordRequest
from app.serializers import booking_dict, clamp_group_size, parse_itinerary, review_dict, tour_dict, user_public, wishlist_dict
from app.utils import CANCELLATION_POLICY, get_current_admin, notify_subscribers

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _form_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None or value == "":
        return default
    return str(value).lower() in {"1", "true", "on", "yes"}


def _tour_types_value(tour_types: Optional[str], tour_type: Optional[str]) -> str:
    raw = tour_types or tour_type or "safari"
    types = [part.strip().lower() for part in raw.split(",") if part.strip()]
    return ", ".join(types or ["safari"])


def _itinerary_json(raw: Optional[str]) -> str:
    return json.dumps(parse_itinerary(raw))


def _apply_tour_fields(
    tour: Tour,
    *,
    title: str,
    description: str,
    price: float,
    duration_value: str,
    duration_unit: str,
    destinations: Optional[str],
    locations: Optional[str],
    accommodations: Optional[str],
    tour_types: Optional[str],
    tour_type: Optional[str],
    max_participants: int,
    included: Optional[str],
    not_included: Optional[str],
    languages: Optional[str],
    live_tour_guide: Optional[str],
    free_cancellation: Optional[str],
    reserve_now_pay_later: Optional[str],
    itinerary: Optional[str],
    meeting_pickup: Optional[str] = None,
    additional_information: Optional[str] = None,
    price_unit: Optional[str] = None,
):
    dest = (destinations or locations or "").strip()
    types_value = _tour_types_value(tour_types, tour_type)
    tour.title = title
    tour.description = description
    tour.price = price
    tour.price_unit = normalize_price_unit(price_unit)
    tour.duration = f"{duration_value} {duration_unit}"
    tour.destinations = dest
    tour.locations = dest
    tour.accommodations = accommodations or ""
    tour.tour_types = types_value
    tour.tour_type = types_value.split(",")[0].strip() if types_value else "safari"
    tour.country = "Uganda"
    tour.max_participants = clamp_group_size(max_participants)
    tour.included = included or ""
    tour.not_included = not_included or ""
    tour.cancellation_policy = CANCELLATION_POLICY
    tour.languages = (languages or "").strip()
    tour.live_tour_guide = _form_bool(live_tour_guide, False)
    tour.free_cancellation = _form_bool(free_cancellation, False)
    tour.reserve_now_pay_later = _form_bool(reserve_now_pay_later, False)
    tour.itinerary = _itinerary_json(itinerary)
    tour.meeting_pickup = (meeting_pickup or "").strip()
    tour.additional_information = (additional_information or "").strip()


def _scope_tours(db: Session, user: User):
    query = db.query(Tour).options(joinedload(Tour.images), joinedload(Tour.reviews))
    if not user.is_superadmin:
        query = query.filter(Tour.creator_id == user.id)
    return query


@router.get("/dashboard")
async def admin_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    tours = _scope_tours(db, user).all()
    if user.is_superadmin:
        total_bookings = db.query(Booking).count()
        total_revenue = db.query(func.sum(Booking.total_price)).filter(Booking.status == "confirmed").scalar() or 0
        total_reviews = db.query(Review).count()
        recent_bookings = (
            db.query(Booking)
            .options(joinedload(Booking.tour), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .limit(10)
            .all()
        )
        reviews = (
            db.query(Review)
            .options(joinedload(Review.tour), joinedload(Review.user))
            .order_by(Review.created_at.desc())
            .limit(10)
            .all()
        )
        pending_bookings = db.query(Booking).filter(Booking.status == "pending").count()
        tour_revenues = (
            db.query(Tour, func.sum(Booking.total_price).label("revenue"))
            .outerjoin(Booking)
            .filter(Booking.status == "confirmed")
            .group_by(Tour.id)
            .order_by(desc("revenue"))
            .limit(5)
            .all()
        )
        avg_rating = db.query(func.avg(Review.rating)).scalar() or 4.5
        rating_distribution = {
            i: db.query(Review).filter(Review.rating == i).count() for i in range(1, 6)
        }
    else:
        total_bookings = db.query(Booking).join(Tour).filter(Tour.creator_id == user.id).count()
        total_revenue = (
            db.query(func.sum(Booking.total_price))
            .join(Tour)
            .filter(Tour.creator_id == user.id, Booking.status == "confirmed")
            .scalar()
            or 0
        )
        total_reviews = db.query(Review).join(Tour).filter(Tour.creator_id == user.id).count()
        recent_bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Tour.creator_id == user.id)
            .options(joinedload(Booking.tour), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .limit(10)
            .all()
        )
        reviews = (
            db.query(Review)
            .join(Tour)
            .filter(Tour.creator_id == user.id)
            .options(joinedload(Review.tour), joinedload(Review.user))
            .order_by(Review.created_at.desc())
            .limit(10)
            .all()
        )
        pending_bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Tour.creator_id == user.id, Booking.status == "pending")
            .count()
        )
        tour_revenues = (
            db.query(Tour, func.sum(Booking.total_price).label("revenue"))
            .outerjoin(Booking)
            .filter(Tour.creator_id == user.id, Booking.status == "confirmed")
            .group_by(Tour.id)
            .order_by(desc("revenue"))
            .limit(5)
            .all()
        )
        avg_rating = (
            db.query(func.avg(Review.rating)).join(Tour).filter(Tour.creator_id == user.id).scalar() or 4.5
        )
        rating_distribution = {
            i: db.query(Review).join(Tour).filter(Tour.creator_id == user.id, Review.rating == i).count()
            for i in range(1, 6)
        }

    top_tours = [
        {
            "title": tour.title,
            "revenue": float(revenue or 0),
            "image": tour.images[0].image_url if tour.images else None,
        }
        for tour, revenue in tour_revenues
    ]
    return {
        "user": user_public(user),
        "tours": [tour_dict(tour) for tour in tours],
        "total_tours": len(tours),
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue or 0),
        "total_reviews": total_reviews,
        "pending_bookings_count": pending_bookings,
        "bookings": [booking_dict(item, include_user=True) for item in recent_bookings],
        "reviews": [review_dict(item) for item in reviews],
        "top_tours": top_tours,
        "average_rating": round(float(avg_rating), 1),
        "rating_distribution": rating_distribution,
    }


@router.post("/tours")
async def create_tour(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    price_unit: Optional[str] = Form("person"),
    duration_value: str = Form(...),
    duration_unit: str = Form(...),
    destinations: Optional[str] = Form(None),
    locations: Optional[str] = Form(None),
    accommodations: Optional[str] = Form(""),
    tour_types: Optional[str] = Form(None),
    tour_type: Optional[str] = Form("safari"),
    max_participants: int = Form(5),
    included: Optional[str] = Form(None),
    not_included: Optional[str] = Form(None),
    languages: Optional[str] = Form(""),
    live_tour_guide: Optional[str] = Form("false"),
    free_cancellation: Optional[str] = Form("true"),
    reserve_now_pay_later: Optional[str] = Form("false"),
    itinerary: Optional[str] = Form("[]"),
    meeting_pickup: Optional[str] = Form(""),
    additional_information: Optional[str] = Form(""),
    cancellation_policy: str = Form(CANCELLATION_POLICY),
    images: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    try:
        new_tour = Tour(
            included=included or "",
            not_included=not_included or "",
            cancellation_policy=CANCELLATION_POLICY,
            creator_id=user.id,
            is_active=True,
            country="Uganda",
        )
        _apply_tour_fields(
            new_tour,
            title=title,
            description=description,
            price=price,
            duration_value=duration_value,
            duration_unit=duration_unit,
            destinations=destinations,
            locations=locations,
            accommodations=accommodations,
            tour_types=tour_types,
            tour_type=tour_type,
            max_participants=max_participants,
            included=included,
            not_included=not_included,
            languages=languages,
            live_tour_guide=live_tour_guide,
            free_cancellation=free_cancellation,
            reserve_now_pay_later=reserve_now_pay_later,
            itinerary=itinerary,
            meeting_pickup=meeting_pickup,
            additional_information=additional_information,
            price_unit=price_unit,
        )
        db.add(new_tour)
        db.flush()
        if images:
            upload_dir = static_file("uploads")
            for idx, image in enumerate(images):
                if not image.content_type or not image.content_type.startswith("image/"):
                    continue
                file_ext = os.path.splitext(image.filename or "")[1]
                filename = f"{uuid.uuid4()}{file_ext}"
                file_path = upload_dir / filename
                with open(file_path, "wb") as handle:
                    handle.write(await image.read())
                db.add(
                    TourImage(
                        tour_id=new_tour.id,
                        image_url=f"/static/uploads/{filename}",
                        is_primary=(idx == 0),
                    )
                )
        db.commit()
        if user.is_superadmin:
            background_tasks.add_task(notify_subscribers, db, new_tour.id)
        return {"success": True, "message": "Tour created successfully", "tour_id": new_tour.id}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating tour: {exc}") from exc


@router.get("/tours/{tour_id}")
async def get_tour(tour_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    duration_parts = tour.duration.split(" ") if tour.duration else ["6", "days"]
    data = tour_dict(tour)
    data["duration_value"] = duration_parts[0]
    data["duration_unit"] = duration_parts[1] if len(duration_parts) > 1 else "days"
    return data


@router.put("/tours/{tour_id}")
async def update_tour(
    tour_id: int,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    price_unit: Optional[str] = Form("person"),
    duration_value: str = Form(...),
    duration_unit: str = Form(...),
    destinations: Optional[str] = Form(None),
    locations: Optional[str] = Form(None),
    accommodations: Optional[str] = Form(""),
    tour_types: Optional[str] = Form(None),
    tour_type: Optional[str] = Form("safari"),
    max_participants: int = Form(5),
    included: Optional[str] = Form(None),
    not_included: Optional[str] = Form(None),
    languages: Optional[str] = Form(""),
    live_tour_guide: Optional[str] = Form("false"),
    free_cancellation: Optional[str] = Form("false"),
    reserve_now_pay_later: Optional[str] = Form("false"),
    itinerary: Optional[str] = Form("[]"),
    meeting_pickup: Optional[str] = Form(""),
    additional_information: Optional[str] = Form(""),
    cancellation_policy: str = Form(CANCELLATION_POLICY),
    is_active: bool = Form(True),
    existing_images: List[str] = Form([]),
    images: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        _apply_tour_fields(
            tour,
            title=title,
            description=description,
            price=price,
            duration_value=duration_value,
            duration_unit=duration_unit,
            destinations=destinations,
            locations=locations,
            accommodations=accommodations,
            tour_types=tour_types,
            tour_type=tour_type,
            max_participants=max_participants,
            included=included,
            not_included=not_included,
            languages=languages,
            live_tour_guide=live_tour_guide,
            free_cancellation=free_cancellation,
            reserve_now_pay_later=reserve_now_pay_later,
            itinerary=itinerary,
            meeting_pickup=meeting_pickup,
            additional_information=additional_information,
            price_unit=price_unit,
        )
        tour.is_active = is_active
        tour.updated_at = datetime.utcnow()

        if existing_images:
            existing_image_ids = [int(img_id) for img_id in existing_images if img_id]
            images_to_remove = (
                db.query(TourImage)
                .filter(TourImage.tour_id == tour.id, TourImage.id.notin_(existing_image_ids))
                .all()
            )
            for img in images_to_remove:
                filename = img.image_url.split("/")[-1]
                image_path = static_file("uploads", filename)
                if image_path.exists():
                    try:
                        os.remove(image_path)
                    except OSError:
                        pass
                db.delete(img)

        if images:
            upload_dir = static_file("uploads")
            for image in images:
                if not image.content_type or not image.content_type.startswith("image/"):
                    continue
                file_ext = os.path.splitext(image.filename or "")[1]
                filename = f"{uuid.uuid4()}{file_ext}"
                file_path = upload_dir / filename
                with open(file_path, "wb") as handle:
                    handle.write(await image.read())
                has_primary = (
                    db.query(TourImage)
                    .filter(TourImage.tour_id == tour.id, TourImage.is_primary == True)  # noqa: E712
                    .count()
                    > 0
                )
                db.add(
                    TourImage(
                        tour_id=tour.id,
                        image_url=f"/static/uploads/{filename}",
                        is_primary=not has_primary,
                    )
                )
        db.commit()
        return {"success": True, "message": "Tour updated successfully"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating tour: {exc}") from exc


@router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    tour = db.query(Tour).options(joinedload(Tour.images)).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="You can only delete tours you created")
    for img in tour.images:
        filename = img.image_url.split("/")[-1]
        image_path = static_file("uploads", filename)
        if image_path.exists():
            try:
                os.remove(image_path)
            except OSError:
                pass
    db.delete(tour)
    db.commit()
    return {"success": True, "message": "Tour deleted successfully"}


@router.post("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    payload: BookingStatusRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if payload.status not in ["pending", "confirmed", "declined", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    booking.status = payload.status
    if payload.status == "cancelled":
        booking.cancelled_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": f"Booking status updated to {payload.status}"}


@router.post("/bookings/bulk-status")
async def bulk_update_booking_status(
    payload: BulkBookingStatusRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if payload.status not in ["pending", "confirmed", "declined", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    if not payload.booking_ids:
        raise HTTPException(status_code=400, detail="No bookings selected")
    if user.is_superadmin:
        bookings = db.query(Booking).filter(Booking.id.in_(payload.booking_ids)).all()
    else:
        bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Booking.id.in_(payload.booking_ids), Tour.creator_id == user.id)
            .all()
        )
    if not bookings:
        raise HTTPException(status_code=404, detail="No valid bookings found")
    now = datetime.utcnow()
    for booking in bookings:
        booking.status = payload.status
        if payload.status == "cancelled":
            booking.cancelled_at = now
    db.commit()
    return {"success": True, "message": f"Updated {len(bookings)} booking(s) to {payload.status}"}


@router.put("/profile")
async def update_profile(
    payload: AdminProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if payload.full_name:
        user.full_name = payload.full_name
    if payload.email:
        existing_user = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.company_name is not None:
        user.company_name = payload.company_name
    if payload.bio is not None:
        user.bio = payload.bio
    db.commit()
    return {"success": True, "message": "Profile updated successfully", "user": user_public(user)}


@router.post("/profile/picture")
async def upload_profile_picture(
    picture: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if not picture.content_type or not picture.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    upload_dir = static_file("uploads", "profile_pictures")
    file_ext = os.path.splitext(picture.filename or "")[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / filename
    with open(file_path, "wb") as handle:
        handle.write(await picture.read())
    if user.picture:
        old_path = disk_from_static_url(user.picture)
        if old_path.exists():
            try:
                os.remove(old_path)
            except OSError:
                pass
    user.picture = f"/static/uploads/profile_pictures/{filename}"
    db.commit()
    return {"success": True, "message": "Profile picture updated successfully", "picture_url": user.picture}


@router.post("/profile/password")
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if not payload.current_password or not payload.new_password:
        raise HTTPException(status_code=400, detail="All password fields are required")
    if not _verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    user.hashed_password = _hash_password(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


@router.post("/reviews/{review_id}/verify")
async def verify_review(review_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    tour = db.query(Tour).filter(Tour.id == review.tour_id).first()
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    review.is_verified = True
    db.commit()
    return {"success": True, "message": "Review verified successfully"}


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    tour = db.query(Tour).filter(Tour.id == review.tour_id).first()
    if not user.is_superadmin and tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(review)
    db.commit()
    return {"success": True, "message": "Review deleted successfully"}


@router.get("/bookings")
async def get_all_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    if user.is_superadmin:
        bookings = (
            db.query(Booking)
            .options(joinedload(Booking.tour).joinedload(Tour.images), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .all()
        )
    else:
        bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Tour.creator_id == user.id)
            .options(joinedload(Booking.tour).joinedload(Tour.images), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .all()
        )
    return [booking_dict(item, include_user=True) for item in bookings]


@router.get("/revenue/analytics")
async def get_revenue_analytics(
    period: str = "monthly",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    current_date = datetime.utcnow()
    labels = []
    data = []
    if period == "monthly":
        for i in range(11, -1, -1):
            month_date = current_date - timedelta(days=30 * i)
            labels.append(month_date.strftime("%b %Y"))
            query = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == "confirmed",
                extract("year", Booking.created_at) == month_date.year,
                extract("month", Booking.created_at) == month_date.month,
            )
            if not user.is_superadmin:
                query = query.join(Tour).filter(Tour.creator_id == user.id)
            data.append(float(query.scalar() or 0))
    elif period == "quarterly":
        for i in range(3, -1, -1):
            quarter_date = current_date - timedelta(days=90 * i)
            quarter_num = (quarter_date.month - 1) // 3 + 1
            labels.append(f"Q{quarter_num} {quarter_date.year}")
            start_month = (quarter_num - 1) * 3 + 1
            end_month = start_month + 2
            query = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == "confirmed",
                extract("year", Booking.created_at) == quarter_date.year,
                extract("month", Booking.created_at) >= start_month,
                extract("month", Booking.created_at) <= end_month,
            )
            if not user.is_superadmin:
                query = query.join(Tour).filter(Tour.creator_id == user.id)
            data.append(float(query.scalar() or 0))
    else:
        for i in range(4, -1, -1):
            year = current_date.year - i
            labels.append(str(year))
            query = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == "confirmed",
                extract("year", Booking.created_at) == year,
            )
            if not user.is_superadmin:
                query = query.join(Tour).filter(Tour.creator_id == user.id)
            data.append(float(query.scalar() or 0))
    return {"period": period, "labels": labels, "data": data}


@router.get("/stats/overview")
async def get_stats_overview(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    if user.is_superadmin:
        total_tours = db.query(Tour).count()
        total_bookings = db.query(Booking).count()
        total_reviews = db.query(Review).count()
        pending_bookings = db.query(Booking).filter(Booking.status == "pending").count()
        confirmed_bookings = db.query(Booking).filter(Booking.status == "confirmed").count()
        total_revenue = db.query(func.sum(Booking.total_price)).filter(Booking.status == "confirmed").scalar() or 0
    else:
        total_tours = db.query(Tour).filter(Tour.creator_id == user.id).count()
        total_bookings = db.query(Booking).join(Tour).filter(Tour.creator_id == user.id).count()
        total_reviews = db.query(Review).join(Tour).filter(Tour.creator_id == user.id).count()
        pending_bookings = (
            db.query(Booking).join(Tour).filter(Tour.creator_id == user.id, Booking.status == "pending").count()
        )
        confirmed_bookings = (
            db.query(Booking).join(Tour).filter(Tour.creator_id == user.id, Booking.status == "confirmed").count()
        )
        total_revenue = (
            db.query(func.sum(Booking.total_price))
            .join(Tour)
            .filter(Tour.creator_id == user.id, Booking.status == "confirmed")
            .scalar()
            or 0
        )
    return {
        "success": True,
        "total_tours": total_tours,
        "total_bookings": total_bookings,
        "total_reviews": total_reviews,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_revenue": float(total_revenue),
        "average_booking_value": round(float(total_revenue) / confirmed_bookings, 2) if confirmed_bookings else 0,
    }


@router.get("/recent/activities")
async def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if user.is_superadmin:
        recent_bookings = (
            db.query(Booking)
            .options(joinedload(Booking.tour), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .limit(limit)
            .all()
        )
    else:
        recent_bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Tour.creator_id == user.id)
            .options(joinedload(Booking.tour), joinedload(Booking.user))
            .order_by(Booking.created_at.desc())
            .limit(limit)
            .all()
        )
    activities = []
    for booking in recent_bookings:
        activities.append(
            {
                "type": "booking",
                "title": f"New Booking #{booking.id}",
                "description": f'{booking.user.full_name if booking.user else "Customer"} booked "{booking.tour.title[:30] if booking.tour else "Tour"}..."',
                "created_at": booking.created_at.isoformat() if booking.created_at else None,
                "icon": "calendar-check",
            }
        )
    return activities[:limit]


@router.get("/booking/{booking_id}/details")
async def get_booking_details(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.tour).joinedload(Tour.images), joinedload(Booking.user))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not user.is_superadmin and booking.tour.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return booking_dict(booking, include_user=True)


@router.get("/bookings/export")
async def export_bookings(
    format: str = "csv",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if user.is_superadmin:
        bookings = db.query(Booking).options(joinedload(Booking.tour), joinedload(Booking.user)).all()
    else:
        bookings = (
            db.query(Booking)
            .join(Tour)
            .filter(Tour.creator_id == user.id)
            .options(joinedload(Booking.tour), joinedload(Booking.user))
            .all()
        )
    export_data = [
        {
            "Booking ID": booking.id,
            "Tour": booking.tour.title if booking.tour else "N/A",
            "Customer": booking.user.full_name if booking.user else "N/A",
            "Email": booking.user.email if booking.user else "N/A",
            "Tour Date": booking.tour_date.isoformat() if booking.tour_date else "N/A",
            "Adults": booking.adults,
            "Kids": booking.kids,
            "Total Price": booking.total_price,
            "Status": booking.status,
            "Payment Method": booking.payment_method,
            "Payment Status": booking.payment_status,
            "Created At": booking.created_at.isoformat() if booking.created_at else "N/A",
        }
        for booking in bookings
    ]
    if format.lower() == "json" or not export_data:
        return JSONResponse(content=export_data)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
    writer.writeheader()
    writer.writerows(export_data)
    return {"csv": output.getvalue()}


@router.get("/wishlist")
async def admin_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
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
    return {
        "user": user_public(user),
        "entries": [wishlist_dict(entry) for entry in entries],
        "tour_counts": [{"title": title, "count": count} for title, count in tour_counts],
        "total_interest": len(entries),
    }
