import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.database import engine, Base, ensure_booking_columns, ensure_tour_columns
from app.paths import FRONTEND_DIST, STATIC_DIR
from app.routes import (
    auth,
    tours,
    admin,
    booking,
    payment,
    newsletter,
    create_admin,
    superadmin,
    superadmin_creation,
    wishlist,
)

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")

app = FastAPI(title="Mmondo Adventures API", debug=True)

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="session_id",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(auth.router)
app.include_router(auth.oauth_router)
app.include_router(tours.router)
app.include_router(admin.router, prefix="/api/operator", tags=["operator"])
app.include_router(booking.router)
app.include_router(payment.router)
app.include_router(newsletter.router)
app.include_router(create_admin.router, prefix="/api/operator", tags=["operator-register"])
app.include_router(superadmin.router)
app.include_router(superadmin_creation.router)
app.include_router(wishlist.router)

Base.metadata.create_all(bind=engine)
ensure_tour_columns()
ensure_booking_columns()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mmondo-api"}


@app.get("/")
async def root_index():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse(
        {
            "message": "Mmondo Adventures API",
            "docs": "/docs",
            "frontend": FRONTEND_URL,
        }
    )


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    reserved = ("api/", "static/", "docs", "redoc", "openapi.json", "auth/")
    if full_path.startswith(reserved) or full_path in {"docs", "redoc", "openapi.json"}:
        raise HTTPException(status_code=404, detail="Not found")

    index = FRONTEND_DIST / "index.html"
    if index.exists():
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index)

    return JSONResponse(
        {
            "detail": "Frontend not built. Start the React app with npm run dev in frontend/.",
            "api": "/api/health",
        },
        status_code=404,
    )
