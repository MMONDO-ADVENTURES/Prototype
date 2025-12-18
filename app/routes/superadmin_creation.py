# app/routes/superadmin_creation.py
# =========================================================
# HARDENED, BOOTSTRAP-SAFE SUPERADMIN CREATION FLOW
# =========================================================
# This version fixes:
# - Auth dependency running too early
# - Manual dependency calls (anti-pattern)
# - Setup route remaining public forever
# - No clear bootstrap boundary
# - Inconsistent auth behavior after DB reset
#
# Architectural principles used:
# - Bootstrap routes MUST NOT have mandatory auth dependencies
# - Auth is applied CONDITIONALLY inside route logic
# - One single source of truth for "is system bootstrapped"
# - FastAPI dependencies are NEVER called manually
# =========================================================

from fastapi import APIRouter, Request, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional
import re

from app.database import get_db
from app.models import User
from app.utils import (
    get_current_user,
    get_current_superadmin,
    hash_password,
)

router = APIRouter(prefix="/superadmin", tags=["superadmin-creation"])
templates = Jinja2Templates(directory="app/templates")

# =========================================================
# BOOTSTRAP HELPERS (SINGLE SOURCE OF TRUTH)
# =========================================================

def is_system_bootstrapped(db: Session) -> bool:
    """
    Returns True once at least ONE superadmin exists.
    After this becomes True, public setup must be locked forever.
    """
    return db.query(User).filter(User.is_superadmin == True).count() > 0


def optional_current_user(request: Request, db: Session) -> Optional[User]:
    """
    Safe auth resolver.
    NEVER raises. Returns None if unauthenticated.

    This is CRITICAL for bootstrap routes.
    """
    try:
        return get_current_user(request, db)
    except Exception:
        return None


# =========================================================
# VALIDATION HELPERS
# =========================================================

def validate_password_strength(password: str):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain an uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain a lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain a number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain a special character"
    return True, ""


def validate_email_format(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


# =========================================================
# GET: SUPERADMIN CREATION PAGE (BOOTSTRAP-SAFE)
# =========================================================

@router.get("/create", response_class=HTMLResponse)
async def superadmin_creation_page(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    RULES:
    - If NO superadmin exists -> public bootstrap page
    - If superadmin exists -> ONLY logged-in superadmins may access
    - If non-superadmin tries -> 404 (route masked)
    """

    bootstrapped = is_system_bootstrapped(db)

    if not bootstrapped:
        # First-time setup (NO AUTH REQUIRED)
        return templates.TemplateResponse(
            "superadmin/create_superadmin.html",
            {
                "request": request,
                "is_first_superadmin": True,
                "current_user": None,
            },
        )

    # System already bootstrapped -> require superadmin
    current_user = optional_current_user(request, db)

    if not current_user or not current_user.is_superadmin:
        # Mask route existence
        raise HTTPException(status_code=404)

    return templates.TemplateResponse(
        "superadmin/create_superadmin.html",
        {
            "request": request,
            "is_first_superadmin": False,
            "current_user": current_user,
        },
    )


# =========================================================
# POST: CREATE SUPERADMIN (BOOTSTRAP + AUTH-AWARE)
# =========================================================

@router.post("/create", response_class=JSONResponse)
async def create_superadmin(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    full_name: str = Form(...),
    company_name: str = Form(None),
    company_link: str = Form(None),
    db: Session = Depends(get_db),
):
    errors = {}
    bootstrapped = is_system_bootstrapped(db)

    # -----------------------------------------------------
    # AUTH CHECK (ONLY AFTER BOOTSTRAP)
    # -----------------------------------------------------
    if bootstrapped:
        current_user = optional_current_user(request, db)
        if not current_user or not current_user.is_superadmin:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"success": False, "errors": {"general": "Superadmin privileges required"}},
            )

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------
    if not validate_email_format(email):
        errors["email"] = "Invalid email format"

    if db.query(User).filter(User.email == email.lower()).first():
        errors["email"] = "Email already registered"

    valid_pw, pw_error = validate_password_strength(password)
    if not valid_pw:
        errors["password"] = pw_error

    if password != confirm_password:
        errors["confirm_password"] = "Passwords do not match"

    if not full_name.strip() or len(full_name.strip()) < 2:
        errors["full_name"] = "Full name must be at least 2 characters"

    if errors:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "errors": errors},
        )

    # -----------------------------------------------------
    # CREATE SUPERADMIN
    # -----------------------------------------------------
    try:
        new_superadmin = User(
            email=email.strip().lower(),
            hashed_password=hash_password(password),
            full_name=full_name.strip(),
            company_name=company_name.strip() if company_name else None,
            company_link=company_link.strip() if company_link else None,
            is_active=True,
            is_admin=True,
            is_superadmin=True,
            email_verified=True,
            auth_method="email",
        )

        db.add(new_superadmin)
        db.commit()
        db.refresh(new_superadmin)

        print(
            f"Superadmin created: {new_superadmin.email} "
            f"by {request.client.host if request.client else 'unknown'}"
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "message": "Superadmin created successfully",
                "user_id": new_superadmin.id,
                "email": new_superadmin.email,
            },
        )

    except Exception as e:
        db.rollback()
        print(f"ERROR creating superadmin: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "errors": {"general": "Internal server error"}},
        )


# =========================================================
# LIST SUPERADMINS (STRICT)
# =========================================================

@router.get("/list", response_class=HTMLResponse)
async def list_superadmins(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    superadmins = (
        db.query(User)
        .filter(User.is_superadmin == True, User.is_active == True)
        .order_by(User.created_at.desc())
        .all()
    )

    return templates.TemplateResponse(
        "superadmin/superadmin_list.html",
        {
            "request": request,
            "superadmins": superadmins,
            "total_superadmins": len(superadmins),
            "current_user": current_user,
        },
    )


# =========================================================
# CHECK FIRST SETUP (PUBLIC, READ-ONLY)
# =========================================================

@router.get("/check-first-setup", response_class=JSONResponse)
async def check_first_setup(db: Session = Depends(get_db)):
    return {
        "first_setup_required": not is_system_bootstrapped(db),
    }
