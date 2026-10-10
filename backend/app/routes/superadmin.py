from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import extract, func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Booking, Tour, User
from app.serializers import booking_dict, user_public
from app.utils import get_current_superadmin, get_dashboard_stats, get_recent_bookings, get_top_tours

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


@router.get("/dashboard")
async def superadmin_dashboard(
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    stats = get_dashboard_stats(db)
    recent_bookings = get_recent_bookings(db, 10)
    top_tours = get_top_tours(db, 5)
    return {
        "superadmin": user_public(superadmin),
        "stats": stats,
        "recent_bookings": [booking_dict(item, include_user=True) for item in recent_bookings],
        "top_tours": [
            {
                "tour": {
                    "id": row[0].id,
                    "title": row[0].title,
                    "price": row[0].price,
                    "image_url": row[0].image_url,
                },
                "booking_count": row[1],
                "revenue": float(row[2] or 0),
            }
            for row in top_tours
        ],
    }


@router.get("/operators")
@router.get("/admins")
async def manage_operators(
    search: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    query = db.query(User).filter(or_(User.is_admin == True, User.is_superadmin == True))  # noqa: E712
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.company_name.ilike(f"%{search}%"),
            )
        )
    operators = query.order_by(User.created_at.desc()).all()
    payload = [user_public(operator) for operator in operators]
    return {"operators": payload, "admins": payload, "search": search}


@router.post("/operators/{operator_id}/delete")
@router.post("/admins/{operator_id}/delete")
async def delete_operator(
    operator_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    if operator_id == superadmin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")
    operator = db.query(User).filter(User.id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    if operator.is_superadmin and operator.id != superadmin.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete other superadmins")
    operator.is_active = False
    operator.is_admin = False
    operator.is_superadmin = False
    db.commit()
    return {"success": True}


@router.get("/companies")
async def view_companies(
    search: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    query = db.query(User).filter(User.company_name.isnot(None), User.company_name != "")
    if search:
        query = query.filter(
            or_(
                User.company_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )
    companies = query.order_by(User.created_at.desc()).all()
    return {"companies": [user_public(company) for company in companies], "search": search}


@router.get("/bookings")
async def view_all_bookings(
    status_filter: str = Query("all"),
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    query = (
        db.query(Booking)
        .options(joinedload(Booking.user), joinedload(Booking.tour))
        .filter(Booking.deleted_at.is_(None))
    )
    if status_filter and status_filter != "all":
        if status_filter == "completed":
            query = query.filter(Booking.payment_status == "completed")
        elif status_filter == "pending":
            query = query.filter(Booking.payment_status == "pending")
        elif status_filter == "cancelled":
            query = query.filter(Booking.cancelled_at.isnot(None))
    if date_from:
        query = query.filter(Booking.created_at >= datetime.strptime(date_from, "%Y-%m-%d"))
    if date_to:
        query = query.filter(Booking.created_at <= datetime.strptime(date_to, "%Y-%m-%d"))
    bookings = query.order_by(Booking.created_at.desc()).all()
    return {
        "bookings": [booking_dict(item, include_user=True) for item in bookings],
        "status_filter": status_filter,
        "date_from": date_from,
        "date_to": date_to,
    }


@router.get("/revenue")
async def revenue_analytics(
    period: str = Query("monthly"),
    db: Session = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin),
):
    revenue_by_month = (
        db.query(
            extract("month", Booking.created_at).label("month"),
            extract("year", Booking.created_at).label("year"),
            func.sum(Booking.total_price).label("revenue"),
            func.count(Booking.id).label("bookings"),
        )
        .filter(
            Booking.deleted_at.is_(None),
            Booking.payment_status == "completed",
            Booking.created_at >= datetime.utcnow() - timedelta(days=180),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    revenue_by_tour = (
        db.query(Tour.title, func.sum(Booking.total_price).label("revenue"), func.count(Booking.id).label("bookings"))
        .join(Booking, Tour.id == Booking.tour_id)
        .filter(Booking.deleted_at.is_(None), Booking.payment_status == "completed")
        .group_by(Tour.id, Tour.title)
        .order_by(func.sum(Booking.total_price).desc())
        .limit(10)
        .all()
    )
    return {
        "period": period,
        "revenue_by_month": [
            {"month": int(row.month), "year": int(row.year), "revenue": float(row.revenue or 0), "bookings": row.bookings}
            for row in revenue_by_month
        ],
        "revenue_by_tour": [
            {"title": row[0], "revenue": float(row[1] or 0), "bookings": row[2]} for row in revenue_by_tour
        ],
    }
