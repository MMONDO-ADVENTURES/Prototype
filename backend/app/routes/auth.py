import os
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.config import base_url, frontend_url
from app.database import get_db
from app.models import User
from app.paths import disk_from_static_url, static_file
from app.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PreferencesRequest,
    ProfileUpdateRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from app.serializers import user_public
from app.utils import (
    clear_auth_cookie,
    create_session,
    delete_session,
    get_current_user,
    hash_password,
    is_superadmin,
    safe_next_path,
    send_email,
    set_auth_cookie,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth_router = APIRouter(tags=["oauth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
APPLE_CLIENT_SECRET = os.getenv("APPLE_CLIENT_SECRET")
BASE_URL = base_url()
FRONTEND_URL = frontend_url()

temporary_reset_tokens = {}


def _load_preferences(user: User) -> dict:
    defaults = {
        "country": "Uganda",
        "dietary": [],
        "pace": "moderate",
        "two_factor": False,
        "passport_expiry": "",
        "has_passport": False,
    }
    if not user.bio:
        return defaults
    try:
        import json

        data = json.loads(user.bio)
        if isinstance(data, dict) and data.get("_profile_prefs"):
            defaults.update({k: v for k, v in data.items() if k != "_profile_prefs"})
            return defaults
    except (ValueError, TypeError):
        pass
    return defaults


def _save_preferences(user: User, prefs: dict) -> None:
    import json

    user.bio = json.dumps({"_profile_prefs": True, **prefs})


def _frontend_redirect(path: str) -> str:
    return f"{FRONTEND_URL.rstrip('/')}{path}"


def _post_login_path(user: User, next_path: Optional[str] = None) -> str:
    destination = safe_next_path(next_path)
    if destination:
        return destination
    if user.is_superadmin:
        return "/superadmin/dashboard"
    if user.is_admin:
        return "/operator/dashboard"
    return "/tours"


@router.get("/me")
async def current_user_me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user:
        return {"user": None, "authenticated": False}
    return {
        "user": user_public(user),
        "authenticated": True,
        "preferences": _load_preferences(user),
    }


@router.get("/test")
async def auth_test():
    return {"message": "Auth router is working!"}


@router.get("/debug/config")
async def debug_config():
    return {
        "google_client_id_set": bool(GOOGLE_CLIENT_ID),
        "google_client_secret_set": bool(GOOGLE_CLIENT_SECRET),
        "base_url": BASE_URL,
        "frontend_url": FRONTEND_URL,
        "redirect_uri": f"{BASE_URL}/auth/google/callback",
    }


@router.post("/signup")
async def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not all([email, payload.password, payload.full_name]):
        raise HTTPException(status_code=400, detail="Please fill in all fields")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    db.commit()
    return {"success": True, "message": "Account created. Please log in."}


@router.post("/login")
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_id = create_session(db, user.id)
    redirect = _post_login_path(user, payload.next)
    response = JSONResponse(
        {
            "success": True,
            "user": user_public(user),
            "redirect": redirect,
        }
    )
    set_auth_cookie(response, session_id)
    return response


@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("auth_session_id")
    if session_id:
        delete_session(db, session_id)
    response = JSONResponse({"success": True})
    clear_auth_cookie(response)
    return response


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found.")

    reset_token = str(uuid.uuid4())
    temporary_reset_tokens[reset_token] = {
        "email": user.email,
        "expires": datetime.utcnow() + timedelta(hours=1),
    }
    reset_link = f"{FRONTEND_URL.rstrip('/')}/reset-password?token={reset_token}"
    body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
            <p>Dear {user.full_name},</p>
            <p>We received a request to reset your password. Please click the link below to proceed:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
        </body>
        </html>
    """
    try:
        send_email(user.email, "Password Reset Request", body, is_html=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}") from exc
    return {"success": True, "message": "Reset link sent!"}


@router.get("/reset-password")
async def validate_reset_token(token: str = ""):
    if not token or token not in temporary_reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    token_info = temporary_reset_tokens[token]
    if datetime.utcnow() > token_info["expires"]:
        del temporary_reset_tokens[token]
        raise HTTPException(status_code=400, detail="Token has expired")
    return {"valid": True, "token": token}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not payload.new_password or not payload.confirm_password:
        raise HTTPException(status_code=400, detail="Please fill in all fields")
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if payload.token not in temporary_reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    token_info = temporary_reset_tokens[payload.token]
    if datetime.utcnow() > token_info["expires"]:
        del temporary_reset_tokens[payload.token]
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter(User.email == token_info["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    del temporary_reset_tokens[payload.token]
    return {"success": True, "message": "Password updated. Please log in."}


@router.get("/profile")
async def profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return {
        "user": user_public(current_user),
        "preferences": _load_preferences(current_user),
        "is_superadmin": is_superadmin(current_user),
    }


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email, User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    current_user.full_name = payload.full_name.strip()
    current_user.email = email
    current_user.phone = payload.phone.strip() if payload.phone else None
    prefs = _load_preferences(current_user)
    prefs["country"] = payload.country or prefs.get("country", "Uganda")
    _save_preferences(current_user, prefs)
    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": user_public(current_user),
        "preferences": prefs,
    }


@router.post("/profile/password")
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="Password change is not available for this account")
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}


@router.put("/profile/preferences")
async def update_preferences(
    payload: PreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    prefs = _load_preferences(current_user)
    prefs["dietary"] = [d.lower() for d in payload.dietary if d]
    prefs["pace"] = payload.pace or prefs.get("pace", "moderate")
    prefs["country"] = payload.country or prefs.get("country", "Uganda")
    prefs["two_factor"] = bool(payload.two_factor)
    prefs["passport_expiry"] = payload.passport_expiry or ""
    prefs["has_passport"] = bool(payload.has_passport) or bool(prefs["passport_expiry"])
    _save_preferences(current_user, prefs)
    db.commit()
    return {"success": True, "message": "Preferences saved", "preferences": prefs}


@router.post("/profile/picture")
async def upload_picture(
    picture: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not picture.content_type or not picture.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_dir = static_file("uploads", "profile_pictures")
    file_ext = os.path.splitext(picture.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / filename
    contents = await picture.read()
    with open(file_path, "wb") as handle:
        handle.write(contents)

    if current_user.picture and current_user.picture.startswith("/static/uploads/profile_pictures/"):
        old_path = disk_from_static_url(current_user.picture)
        if old_path.exists():
            try:
                os.remove(old_path)
            except OSError:
                pass

    current_user.picture = f"/static/uploads/profile_pictures/{filename}"
    db.commit()
    return {
        "success": True,
        "message": "Profile picture updated",
        "picture_url": current_user.picture,
    }


@oauth_router.get("/auth/google")
@router.get("/google")
async def google_login(request: Request, next: str = None):
    destination = safe_next_path(next)
    if destination:
        request.session["post_login_next"] = destination
    else:
        request.session.pop("post_login_next", None)

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(_frontend_redirect("/login?error=Google+OAuth+not+configured"))

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BASE_URL}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")


@oauth_router.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        code = request.query_params.get("code")
        error = request.query_params.get("error")
        if error:
            return RedirectResponse(_frontend_redirect(f"/login?error=Google+auth+failed:{error}"))
        if not code:
            return RedirectResponse(_frontend_redirect("/login?error=No+authorization+code+received"))

        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{BASE_URL}/auth/google/callback",
        }
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if token_response.status_code != 200:
                return RedirectResponse(_frontend_redirect("/login?error=Failed+to+exchange+code+for+token"))
            access_token = token_response.json().get("access_token")
            if not access_token:
                return RedirectResponse(_frontend_redirect("/login?error=No+access+token+received"))
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_response.status_code != 200:
                return RedirectResponse(_frontend_redirect("/login?error=Failed+to+get+user+information"))
            user_info = userinfo_response.json()

        email = user_info.get("email")
        google_id = user_info.get("sub")
        name = user_info.get("name", "")
        picture = user_info.get("picture")
        email_verified = user_info.get("email_verified", False)
        if not email:
            return RedirectResponse(_frontend_redirect("/login?error=No+email+provided+by+Google"))

        user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()
        if user:
            if not user.google_id:
                user.google_id = google_id
            if picture and hasattr(user, "picture"):
                user.picture = picture
            db.commit()
        else:
            user_data = {
                "email": email,
                "hashed_password": hash_password(secrets.token_urlsafe(32)),
                "full_name": name or email.split("@")[0],
                "google_id": google_id,
                "email_verified": email_verified,
            }
            if hasattr(User, "picture"):
                user_data["picture"] = picture
            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)

        session_id = create_session(db, user.id)
        destination = safe_next_path(request.session.pop("post_login_next", None)) or "/tours?just_logged_in=true"
        response = RedirectResponse(_frontend_redirect(destination), status_code=status.HTTP_302_FOUND)
        set_auth_cookie(response, session_id)
        return response
    except Exception:
        return RedirectResponse(_frontend_redirect("/login?error=Google+authentication+failed"))


@oauth_router.get("/auth/apple")
@router.get("/apple")
async def apple_login():
    return RedirectResponse(_frontend_redirect("/login?error=Apple+OAuth+not+configured"))
