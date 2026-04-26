"""
Create or update demo login users without resetting the database.

Run:
    cd backend
    python seed_demo_users.py
"""

from __future__ import annotations

from pathlib import Path
import sys

from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

# Ensure local app package is importable when running from backend directory.
sys.path.insert(0, str(Path(__file__).parent))

from app.db import Base, SessionLocal, engine
from app.models import Expert, Farmer, User
from app.services.security import get_password_hash

DEMO_USERS = [
    {
        "full_name": "System Admin",
        "email": "admin@agro.com",
        "password": "admin123",
        "role": "admin",
        "phone": "9000000001",
    },
    {
        "full_name": "Farmer One",
        "email": "farmer1@agro.com",
        "password": "123456",
        "role": "farmer",
        "phone": "9000000002",
    },
    {
        "full_name": "Farmer Two",
        "email": "farmer2@agro.com",
        "password": "123456",
        "role": "farmer",
        "phone": "9000000003",
    },
    {
        "full_name": "Expert One",
        "email": "expert1@agro.com",
        "password": "123456",
        "role": "expert",
        "phone": "9000000004",
    },
    {
        "full_name": "Expert Two",
        "email": "expert2@agro.com",
        "password": "123456",
        "role": "expert",
        "phone": "9000000005",
    },
]


def get_user_by_identifier(db, email: str):
    normalized = email.lower()
    return (
        db.query(User)
        .filter(
            or_(
                func.lower(User.email) == normalized,
                func.lower(User.username) == normalized,
            )
        )
        .first()
    )


def ensure_farmer_profile(db, user: User) -> None:
    profile = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if profile:
        if not profile.name:
            profile.name = user.full_name
        if not profile.location:
            profile.location = "Unknown"
        if profile.total_land is None:
            profile.total_land = 0.0
        return

    db.add(
        Farmer(
            user_id=user.id,
            name=user.full_name,
            location="Unknown",
            total_land=0.0,
        )
    )


def ensure_expert_profile(db, user: User) -> None:
    profile = db.query(Expert).filter(Expert.user_id == user.id).first()
    if profile:
        if not profile.specialization:
            profile.specialization = "General Agriculture"
        profile.approval_status = "approved"
        profile.is_active = True
        return

    db.add(
        Expert(
            user_id=user.id,
            specialization="General Agriculture",
            bio="Demo expert account",
            approval_status="approved",
            is_active=True,
        )
    )


def upsert_demo_users() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        created = 0
        updated = 0

        for item in DEMO_USERS:
            email = item["email"]
            user = get_user_by_identifier(db, email)

            if user is None:
                user = User(
                    full_name=item["full_name"],
                    email=email,
                    username=email,
                    hashed_password=get_password_hash(item["password"]),
                    role=item["role"],
                    phone=item.get("phone"),
                )
                db.add(user)
                db.flush()
                created += 1
            else:
                user.full_name = item["full_name"]
                user.email = email
                user.username = email
                user.hashed_password = get_password_hash(item["password"])
                user.role = item["role"]
                user.phone = item.get("phone")
                updated += 1

            if item["role"] == "farmer":
                ensure_farmer_profile(db, user)
            elif item["role"] == "expert":
                ensure_expert_profile(db, user)

        db.commit()

        print(f"Demo users ready. Created: {created}, Updated: {updated}")
        print("Login credentials:")
        print("  Admin: admin@agro.com / admin123")
        print("  Farmer: farmer1@agro.com / 123456")
        print("  Farmer: farmer2@agro.com / 123456")
        print("  Expert: expert1@agro.com / 123456")
        print("  Expert: expert2@agro.com / 123456")
    except IntegrityError as exc:
        db.rollback()
        raise RuntimeError(f"Failed to seed demo users due to unique constraint: {exc}") from exc
    finally:
        db.close()


if __name__ == "__main__":
    upsert_demo_users()
