from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AdminRegisterRequest
from app.serializers import user_public
from app.utils import create_session, hash_password, set_auth_cookie

router = APIRouter()


@router.post("/register")
async def register_admin(payload: AdminRegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    contact_name = (payload.full_name or payload.company_name or "").strip()
    specialization = (payload.specialization or "").strip()
    new_admin = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=contact_name,
        company_name=payload.company_name.strip(),
        company_link=payload.company_link,
        phone=(payload.phone or "").strip() or None,
        bio=specialization or None,
        is_admin=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    session_id = create_session(db, new_admin.id)
    response = JSONResponse(
        {
            "success": True,
            "user": user_public(new_admin),
            "redirect": "/operator/dashboard",
        },
        status_code=status.HTTP_201_CREATED,
    )
    set_auth_cookie(response, session_id)
    return response
