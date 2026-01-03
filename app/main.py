# app/main.py

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
import os

from app.routes import (
    auth,
    tours,
    admin,
    booking,
    payment,
    newsletter,
    culture,
    tour_details,
    create_admin,
    culture_admin,
    superadmin,
    superadmin_creation # <-- Added by Bammez: culture admin routes
)
from app.database import engine, Base
from dotenv import load_dotenv

app = FastAPI(debug=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="app/templates")
templates.env.auto_reload = True


# Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key="your_secret_key",  # you can move this to .env later
    session_cookie="session_id",
)

# app.add_middleware(HTTPSRedirectMiddleware)

# Include all routes
app.include_router(auth.router)
app.include_router(tours.router)
app.include_router(culture.router)
app.include_router(admin.router)
app.include_router(booking.router)
app.include_router(payment.router)
app.include_router(newsletter.router)
app.include_router(tour_details.router)
app.include_router(create_admin.router)
app.include_router(culture_admin.router)
app.include_router(superadmin.router)
app.include_router(superadmin_creation.router) # <-- Added by Bammez: /admin/cultures etc.

# Create database tables
Base.metadata.create_all(bind=engine)
