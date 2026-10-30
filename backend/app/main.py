import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.config import cors_origins, frontend_url
from app.database import engine, Base, ensure_booking_columns, ensure_tour_columns, ensure_user_columns
from app.paths import FRONTEND_DIST, STATIC_DIR
from app.routes import (
    auth,
    tours,
    admin,
    booking,
    payment,
    inquiries,
    newsletter,
    create_admin,
    superadmin,
    superadmin_creation,
    wishlist,
)

load_dotenv()

FRONTEND_URL = frontend_url()
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")

app = FastAPI(title="Mmondo Adventures API", debug=True)

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="session_id",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
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
app.include_router(inquiries.router)
app.include_router(newsletter.router)
app.include_router(create_admin.router, prefix="/api/operator", tags=["operator-register"])
app.include_router(superadmin.router)
app.include_router(superadmin_creation.router)
app.include_router(wishlist.router)

Base.metadata.create_all(bind=engine)
ensure_tour_columns()
ensure_booking_columns()
ensure_user_columns()


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok", "service": "mmondo-api"}


SITE_ORIGIN = "https://www.mmondoadventures.com"

PUBLIC_SITEMAP = (
    ("/", "weekly", "1.0"),
    ("/tours", "daily", "0.9"),
    ("/parks", "weekly", "0.8"),
    ("/operators", "weekly", "0.8"),
    ("/about", "monthly", "0.7"),
    ("/contact", "monthly", "0.7"),
    ("/blogs", "weekly", "0.7"),
    ("/careers", "monthly", "0.5"),
    ("/operator", "monthly", "0.5"),
    ("/newsletter", "monthly", "0.4"),
)


@app.api_route("/", methods=["GET", "HEAD"])
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


@app.api_route("/sitemap.xml", methods=["GET", "HEAD"])
async def sitemap():
    rows = []
    for path, changefreq, priority in PUBLIC_SITEMAP:
        loc = SITE_ORIGIN if path == "/" else f"{SITE_ORIGIN}{path}"
        rows.append(
            "  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            "  </url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )
    return Response(content=xml, media_type="application/xml")


@app.api_route("/robots.txt", methods=["GET", "HEAD"])
async def robots():
    body = f"User-agent: *\nAllow: /\n\nSitemap: {SITE_ORIGIN}/sitemap.xml\n"
    return Response(content=body, media_type="text/plain")


@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
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
