import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import Base

load_dotenv()

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_SQLITE_PATH = _BACKEND_ROOT / "test.db"
_LEGACY_SQLITE = _BACKEND_ROOT.parent / "test.db"
if not _SQLITE_PATH.exists() and _LEGACY_SQLITE.exists():
    _SQLITE_PATH = _LEGACY_SQLITE

SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL") or f"sqlite:///{_SQLITE_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_tour_columns():
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    statements = {
        "destinations": "ALTER TABLE tours ADD COLUMN destinations VARCHAR(500)",
        "accommodations": "ALTER TABLE tours ADD COLUMN accommodations VARCHAR(1000)",
        "tour_types": "ALTER TABLE tours ADD COLUMN tour_types VARCHAR(200)",
        "languages": "ALTER TABLE tours ADD COLUMN languages VARCHAR(300)",
        "live_tour_guide": "ALTER TABLE tours ADD COLUMN live_tour_guide BOOLEAN DEFAULT 0",
        "free_cancellation": "ALTER TABLE tours ADD COLUMN free_cancellation BOOLEAN DEFAULT 0",
        "reserve_now_pay_later": "ALTER TABLE tours ADD COLUMN reserve_now_pay_later BOOLEAN DEFAULT 0",
        "itinerary": "ALTER TABLE tours ADD COLUMN itinerary TEXT",
        "meeting_pickup": "ALTER TABLE tours ADD COLUMN meeting_pickup TEXT",
        "additional_information": "ALTER TABLE tours ADD COLUMN additional_information TEXT",
        "price_unit": "ALTER TABLE tours ADD COLUMN price_unit VARCHAR(20) DEFAULT 'person'",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(tours)"))}
        if not existing:
            return
        for column, sql in statements.items():
            if column not in existing:
                conn.execute(text(sql))
        if "destinations" in existing or "destinations" in statements:
            conn.execute(
                text(
                    "UPDATE tours SET destinations = locations "
                    "WHERE (destinations IS NULL OR destinations = '') AND locations IS NOT NULL"
                )
            )
        conn.execute(
            text("UPDATE tours SET country = 'Uganda' WHERE country IS NULL OR country = ''")
        )
        conn.execute(
            text("UPDATE tours SET live_tour_guide = 0 WHERE live_tour_guide IS NULL")
        )
        conn.execute(
            text("UPDATE tours SET free_cancellation = 0 WHERE free_cancellation IS NULL")
        )
        conn.execute(
            text("UPDATE tours SET reserve_now_pay_later = 0 WHERE reserve_now_pay_later IS NULL")
        )
        conn.execute(
            text("UPDATE tours SET price_unit = 'person' WHERE price_unit IS NULL OR price_unit = ''")
        )


def ensure_user_columns():
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    statements = {
        "address": "ALTER TABLE users ADD COLUMN address VARCHAR(300)",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if not existing:
            return
        for column, sql in statements.items():
            if column not in existing:
                conn.execute(text(sql))


def ensure_booking_columns():
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    statements = {
        "companions": "ALTER TABLE bookings ADD COLUMN companions TEXT",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(bookings)"))}
        if not existing:
            return
        for column, sql in statements.items():
            if column not in existing:
                conn.execute(text(sql))