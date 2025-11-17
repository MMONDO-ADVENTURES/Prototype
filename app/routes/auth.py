import uuid
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.models import User
from app.utils import get_current_user, create_session, delete_session, verify_password, hash_password, send_email
from app.database import get_db
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates", auto_reload=True)
temporary_reset_tokens = {}
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

@router.get("/signup", response_class=HTMLResponse)
async def get_signup(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.post("/signup", response_class=HTMLResponse)
async def signup(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    email = form.get("email")
    password = form.get("password")
    full_name = form.get("full_name")
    
    if not all([email, password, full_name]):
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Please fill in all fields"})
    
    if db.query(User).filter(User.email == email).first():
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Email already exists"})
    
    hashed_password = hash_password(password)
    new_user = User(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(new_user)
    db.commit()
    
    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

@router.get("/login", response_class=HTMLResponse)
async def get_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login", response_class=HTMLResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    email = form.get("email")
    password = form.get("password")
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(password, user.hashed_password):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid email or password"})
    
    session_id = create_session(db, user.id)
    response = RedirectResponse(url="/tours", status_code=status.HTTP_302_FOUND)
    response.set_cookie(key="auth_session_id", value=session_id, httponly=True, max_age=1800, samesite="Lax", path="/")
    return response

@router.get("/logout", response_class=HTMLResponse)
async def logout(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("auth_session_id")
    if session_id:
        delete_session(db, session_id)
    
    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.delete_cookie(key="auth_session_id")
    return response

@router.get("/forgot-password", response_class=HTMLResponse)
async def forgot_password_form(request: Request):
    return templates.TemplateResponse("forgot_password.html", {"request": request})

@router.post("/forgot-password", response_class=HTMLResponse)
async def forgot_password(request: Request, email: str = Form(...), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return templates.TemplateResponse("forgot_password.html", {"request": request, "error": "Email not found."})
        
        reset_token = str(uuid.uuid4())
        temporary_reset_tokens[reset_token] = {
            "email": email,
            "expires": datetime.utcnow() + timedelta(hours=1)
        }

        reset_link = f"{BASE_URL.rstrip('/')}/reset-password?token={reset_token}"
        subject = "Password Reset Request"
        body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
                <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <tr style="background-color: #003366; color: #ffffff;">
                    <td style="padding: 20px; font-size: 18px;">
                    Password Reset Request
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px;">
                    <p>Dear {user.full_name},</p>
                    <p>We received a request to reset your password. Please click the link below to proceed:</p>
                    <p><a href="{reset_link}" style="background-color: #003366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                    <p>If you did not request this, please ignore this email or contact our support team.</p>
                    <p>Best regards,<br>Pearl Tours Support Team</p>
                    </td>
                </tr>
                <tr style="background-color: #f0f0f0; text-align: center;">
                    <td style="padding: 10px; font-size: 12px; color: #777;">
                    &copy; {datetime.now().year} Pearl Tours. All rights reserved.
                    </td>
                </tr>
                </table>
            </body>
            </html>
            """

        try:
            send_email(user.email, subject, body, is_html=True) 
        except Exception as e: 
            return templates.TemplateResponse("forgot_password.html", {"request": request, "error": f"Failed to send email: {str(e)}"})

        return templates.TemplateResponse("forgot_password.html", {"request": request, "message": "Reset link sent!"})
    
    except Exception as e:
        return templates.TemplateResponse("forgot_password.html", {"request": request, "error": "An unexpected error occurred."})

@router.get("/reset-password", response_class=HTMLResponse)
async def show_reset_password_form(request: Request, token: str = ""):
    if not token:
        return templates.TemplateResponse("reset_password.html", {
            "request": request,
            "error": "Missing reset token"
        })

    if token not in temporary_reset_tokens:
        return templates.TemplateResponse("reset_password.html", {
            "request": request,
            "error": "Invalid or expired token"
        })

    token_info = temporary_reset_tokens[token]
    if datetime.utcnow() > token_info["expires"]:
        del temporary_reset_tokens[token]
        return templates.TemplateResponse("reset_password.html", {
            "request": request,
            "error": "Token has expired"
        })

    return templates.TemplateResponse("reset_password.html", {
        "request": request,
        "token": token
    })

@router.post("/reset-password", response_class=HTMLResponse)
async def reset_password_post(
    request: Request,
    token: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):
    error = None
    try:
        if not new_password or not confirm_password:
            error = "Please fill in all fields"
            raise ValueError
        
        if new_password != confirm_password:
            error = "Passwords do not match"
            raise ValueError
        
        if len(new_password) < 8:
            error = "Password must be at least 8 characters"
            raise ValueError

        if token not in temporary_reset_tokens:
            error = "Invalid or expired token"
            raise ValueError

        token_info = temporary_reset_tokens[token]
        if datetime.utcnow() > token_info["expires"]:
            del temporary_reset_tokens[token]
            error = "Token has expired"
            raise ValueError

        email = token_info["email"]
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            error = "User not found"
            raise ValueError

        hashed_password = hash_password(new_password)
        user.hashed_password = hashed_password
        db.commit()
        db.refresh(user)

        del temporary_reset_tokens[token]
        return RedirectResponse(url="/login", status_code=303)

    except Exception as e:
        db.rollback()
        return templates.TemplateResponse("reset_password.html", {
            "request": request,
            "error": error or "An error occurred",
            "token": token
        })