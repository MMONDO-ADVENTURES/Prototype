import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import SuperadminCreateRequest
from app.serializers import user_public
from app.utils import get_current_superadmin, get_current_user, hash_password

router = APIRouter(prefix="/api/superadmin", tags=["superadmin-creation"])


def is_system_bootstrapped(db: Session) -> bool:
    return db.query(User).filter(User.is_superadmin == True).count() > 0  # noqa: E712


def optional_current_user(request: Request, db: Session) -> Optional[User]:
    try:
        return get_current_user(request, db)
    except Exception:
        return None


def validate_password_strength(password: str):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain an uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain a lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain a number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain a special character"
    return True, ""


def validate_email_format(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email))


@router.get("/create")
async def superadmin_creation_page(request: Request, db: Session = Depends(get_db)):
    bootstrapped = is_system_bootstrapped(db)
    if not bootstrapped:
        return {"is_first_superadmin": True, "allowed": True, "current_user": None}
    current_user = optional_current_user(request, db)
    if not current_user or not current_user.is_superadmin:
        raise HTTPException(status_code=404)
    return {
        "is_first_superadmin": False,
        "allowed": True,
        "current_user": user_public(current_user),
    }


@router.post("/create")
async def create_superadmin(
    request: Request,
    payload: SuperadminCreateRequest,
    db: Session = Depends(get_db),
):
    errors = {}
    bootstrapped = is_system_bootstrapped(db)
    if bootstrapped:
        current_user = optional_current_user(request, db)
        if not current_user or not current_user.is_superadmin:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"success": False, "errors": {"general": "Superadmin privileges required"}},
            )

    if not validate_email_format(payload.email):
        errors["email"] = "Invalid email format"
    if db.query(User).filter(User.email == payload.email.lower()).first():
        errors["email"] = "Email already registered"
    valid_pw, pw_error = validate_password_strength(payload.password)
    if not valid_pw:
        errors["password"] = pw_error
    if payload.password != payload.confirm_password:
        errors["confirm_password"] = "Passwords do not match"
    if not payload.full_name.strip() or len(payload.full_name.strip()) < 2:
        errors["full_name"] = "Full name must be at least 2 characters"
    if errors:
        return JSONResponse(status_code=400, content={"success": False, "errors": errors})

    try:
        new_superadmin = User(
            email=payload.email.strip().lower(),
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name.strip(),
            company_name=payload.company_name.strip() if payload.company_name else None,
            company_link=payload.company_link.strip() if payload.company_link else None,
            is_active=True,
            is_admin=True,
            is_superadmin=True,
            email_verified=True,
            auth_method="email",
        )
        db.add(new_superadmin)
        db.commit()
        db.refresh(new_superadmin)
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Superadmin created successfully",
                "user_id": new_superadmin.id,
                "email": new_superadmin.email,
            },
        )
    except Exception:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "errors": {"general": "Internal server error"}},
        )


@router.get("/list")
async def list_superadmins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    superadmins = (
        db.query(User)
        .filter(User.is_superadmin == True, User.is_active == True)  # noqa: E712
        .order_by(User.created_at.desc())
        .all()
    )
    return {
        "superadmins": [user_public(item) for item in superadmins],
        "total_superadmins": len(superadmins),
        "current_user": user_public(current_user),
    }


@router.get("/check-first-setup")
async def check_first_setup(db: Session = Depends(get_db)):
    return {"first_setup_required": not is_system_bootstrapped(db)}
