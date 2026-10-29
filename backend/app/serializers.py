from typing import Any, Optional
import json
import re

from app.models import Booking, Review, Tour, TourImage, User, WishlistEntry, normalize_price_unit
from app.utils import CANCELLATION_POLICY, can_cancel_booking, can_edit_booking, last_free_change_date

MAX_GROUP_SIZE = 5


def iso(value) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def iso_date(value) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "date") and callable(getattr(value, "date")):
        try:
            return value.date().isoformat()
        except TypeError:
            pass
    if hasattr(value, "isoformat"):
        return value.isoformat()[:10]
    return str(value)[:10]


def csv_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value or "").split(",") if part.strip()]


def parse_itinerary(value) -> list[dict[str, Any]]:
    if not value:
        return []
    if isinstance(value, list):
        data = value
    else:
        try:
            data = json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return []
    if not isinstance(data, list):
        return []
    days = []
    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            continue
        activities = item.get("activities") or []
        if isinstance(activities, str):
            activities = csv_list(activities)
        parsed_activities = []
        for entry in activities:
            if isinstance(entry, dict):
                title = str(entry.get("title") or entry.get("name") or entry.get("text") or "").strip()
                duration = str(entry.get("duration") or "").strip()
            else:
                title = str(entry).strip()
                duration = ""
            if not title:
                continue
            parsed_activities.append({"title": title, "duration": duration})
        day_from, day_to = _day_span(item, index)
        days.append(
            {
                "day": day_from,
                "day_from": day_from,
                "day_to": day_to,
                "title": str(item.get("title") or f"Day {index}").strip(),
                "destination": str(item.get("destination") or "").strip(),
                "accommodation": str(item.get("accommodation") or "").strip(),
                "duration": str(item.get("duration") or "").strip(),
                "activities": parsed_activities,
            }
        )
    return days


def _positive_int(value) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        number = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _day_span(item: dict[str, Any], index: int) -> tuple[int, int]:
    raw_from = item.get("day_from", item.get("day"))
    raw_to = item.get("day_to", item.get("day_end"))
    if isinstance(raw_from, str):
        match = re.search(r"(\d+)\s*[-–]\s*(\d+)", raw_from.strip())
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            return start, max(start, end)
    start = _positive_int(raw_from) or index
    end = _positive_int(raw_to) or start
    return start, max(start, end)


def parse_companions(value) -> list[dict[str, Any]]:
    if not value:
        return []
    if isinstance(value, list):
        data = value
    else:
        try:
            data = json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return []
    if not isinstance(data, list):
        return []
    companions = []
    for item in data:
        if isinstance(item, str):
            name = item.strip()
            if name:
                companions.append({"full_name": name, "role": "adult", "details": ""})
            continue
        if not isinstance(item, dict):
            continue
        name = str(item.get("full_name") or item.get("name") or "").strip()
        details = str(item.get("details") or "").strip()
        role = str(item.get("role") or "adult").strip().lower()
        if role not in {"adult", "child"}:
            role = "adult"
        if name or details:
            companions.append({"full_name": name, "role": role, "details": details})
    return companions[: MAX_GROUP_SIZE - 1]


def companions_json(value) -> str:
    return json.dumps(parse_companions(value))


def destinations_of(tour: Tour) -> str:
    return (getattr(tour, "destinations", None) or tour.locations or "").strip()


def tour_types_of(tour: Tour) -> list[str]:
    raw = getattr(tour, "tour_types", None) or tour.tour_type or "safari"
    types = [item.lower() for item in csv_list(raw)]
    return types or ["safari"]


def clamp_group_size(value) -> int:
    try:
        count = int(value)
    except (TypeError, ValueError):
        count = MAX_GROUP_SIZE
    return max(1, min(count, MAX_GROUP_SIZE))


def user_public(user: Optional[User]) -> Optional[dict[str, Any]]:
    if not user:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": bool(user.is_active),
        "is_admin": bool(user.is_admin),
        "is_operator": bool(user.is_admin),
        "is_superadmin": bool(user.is_superadmin),
        "phone": user.phone,
        "address": getattr(user, "address", None),
        "bio": user.bio,
        "newsletter_subscribed": bool(user.newsletter_subscribed),
        "company_name": user.company_name,
        "company_link": user.company_link,
        "picture": user.picture,
        "created_at": iso(user.created_at),
        "email_verified": bool(user.email_verified),
        "auth_method": user.auth_method,
    }


def image_dict(image: TourImage) -> dict[str, Any]:
    return {
        "id": image.id,
        "image_url": image.image_url,
        "is_primary": bool(image.is_primary),
    }


def tour_dict(tour: Tour, *, include_reviews: bool = False) -> dict[str, Any]:
    images = [image_dict(img) for img in (tour.images or [])]
    ratings = [r.rating for r in (tour.reviews or []) if r.rating]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.9
    primary = next((img["image_url"] for img in images if img.get("is_primary")), None)
    destinations = destinations_of(tour)
    types = tour_types_of(tour)
    payload = {
        "id": tour.id,
        "title": tour.title,
        "description": tour.description,
        "price": tour.price,
        "price_unit": normalize_price_unit(getattr(tour, "price_unit", None)),
        "duration": tour.duration,
        "destinations": destinations,
        "locations": destinations,
        "accommodations": getattr(tour, "accommodations", None) or "",
        "image_url": tour.image_url or primary,
        "created_at": iso(tour.created_at),
        "updated_at": iso(tour.updated_at),
        "is_active": bool(tour.is_active),
        "tour_type": types[0],
        "tour_types": types,
        "country": "Uganda",
        "max_participants": clamp_group_size(tour.max_participants),
        "included": tour.included,
        "not_included": tour.not_included,
        "cancellation_policy": CANCELLATION_POLICY if getattr(tour, "free_cancellation", False) else (tour.cancellation_policy or CANCELLATION_POLICY),
        "languages": getattr(tour, "languages", None) or "",
        "live_tour_guide": bool(getattr(tour, "live_tour_guide", False)),
        "free_cancellation": bool(getattr(tour, "free_cancellation", False)),
        "reserve_now_pay_later": bool(getattr(tour, "reserve_now_pay_later", False)),
        "itinerary": parse_itinerary(getattr(tour, "itinerary", None)),
        "meeting_pickup": getattr(tour, "meeting_pickup", None) or "",
        "additional_information": getattr(tour, "additional_information", None) or "",
        "creator_id": tour.creator_id,
        "creator": user_public(getattr(tour, "creator", None)),
        "images": images,
        "avg_rating": avg_rating,
        "review_count": len(ratings),
    }
    if include_reviews:
        payload["reviews"] = [review_dict(review) for review in (tour.reviews or [])]
    return payload


def review_dict(review: Review) -> dict[str, Any]:
    return {
        "id": review.id,
        "tour_id": review.tour_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "comment": review.comment,
        "is_verified": bool(review.is_verified),
        "created_at": iso(review.created_at),
        "user": user_public(review.user) if getattr(review, "user", None) else None,
        "tour_title": review.tour.title if getattr(review, "tour", None) else None,
    }


def booking_dict(booking: Booking, *, include_user: bool = False) -> dict[str, Any]:
    payload = {
        "id": booking.id,
        "user_id": booking.user_id,
        "tour_id": booking.tour_id,
        "adults": booking.adults,
        "kids": booking.kids,
        "tour_date": iso_date(booking.tour_date),
        "total_price": booking.total_price,
        "is_private": bool(booking.is_private),
        "created_at": iso(booking.created_at),
        "payment_method": booking.payment_method,
        "payment_id": booking.payment_id,
        "payment_status": booking.payment_status,
        "status": booking.status,
        "deleted_at": iso(booking.deleted_at),
        "cancelled_at": iso(booking.cancelled_at),
        "donation": booking.donation,
        "special_requirements": booking.special_requirements,
        "companions": parse_companions(getattr(booking, "companions", None)),
        "participant_count": booking.participant_count,
        "can_cancel": can_cancel_booking(booking),
        "can_edit": can_edit_booking(booking),
        "cancel_by": iso_date(last_free_change_date(booking.tour_date)),
        "tour": tour_dict(booking.tour) if getattr(booking, "tour", None) else None,
    }
    if include_user:
        payload["user"] = user_public(booking.user) if getattr(booking, "user", None) else None
    return payload


def wishlist_dict(entry: WishlistEntry) -> dict[str, Any]:
    return {
        "id": entry.id,
        "tour_id": entry.tour_id,
        "user_id": entry.user_id,
        "full_name": entry.full_name,
        "email": entry.email,
        "phone": entry.phone,
        "country": entry.country,
        "preferred_date": iso(entry.preferred_date),
        "adults": entry.adults,
        "kids": entry.kids,
        "message": entry.message,
        "created_at": iso(entry.created_at),
        "tour": tour_dict(entry.tour) if getattr(entry, "tour", None) else None,
    }
