"""
Seed raw feature data without resetting the database.

This script inserts records for:
- Employment jobs: 5
- Workers: 6
- Equipment rental listings: 20
- Farming techniques: 18

It is idempotent for the records it manages by deleting and recreating only rows
with seed markers.

Run:
    cd backend
    python seed_raw_feature_data.py
"""

from __future__ import annotations

from pathlib import Path
import random
import sys

from sqlalchemy import create_engine
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

# Ensure local app package is importable when running from backend directory.
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.db import Base
from app.models import Equipment, Expert, Farmer, FarmingTechnique, Job, User, Worker
from app.services.security import get_password_hash

DATABASE_URL = settings.database_url
ENGINE = create_engine(
    DATABASE_URL,
    future=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)

SEED_MARKERS = {
    "job": "[RAW_JOB]",
    "worker": "[RAW_WORKER]",
    "equipment": "[RAW_EQUIPMENT]",
    "technique": "[RAW_TECHNIQUE]",
}


def ensure_seed_farmer(db: Session) -> Farmer:
    farmer = db.query(Farmer).join(User, Farmer.user_id == User.id).filter(func.lower(User.email) == "farmer1@agro.com").first()
    if farmer:
        return farmer

    user = db.query(User).filter(func.lower(User.email) == "farmer1@agro.com").first()
    if user is None:
        user = User(
            full_name="Farmer One",
            email="farmer1@agro.com",
            username="farmer1@agro.com",
            hashed_password=get_password_hash("123456"),
            role="farmer",
            phone="9000000002",
        )
        db.add(user)
        db.flush()

    farmer = Farmer(
        user_id=user.id,
        name="Farmer One",
        location="Rampur Village, Punjab",
        total_land=5.0,
    )
    db.add(farmer)
    db.flush()
    return farmer


def ensure_seed_experts(db: Session) -> list[Expert]:
    experts = (
        db.query(Expert)
        .join(User, Expert.user_id == User.id)
        .filter(func.lower(User.email).in_(["expert1@agro.com", "expert2@agro.com"]))
        .all()
    )
    if len(experts) >= 2:
        return experts

    for email, name in [("expert1@agro.com", "Expert One"), ("expert2@agro.com", "Expert Two")]:
        user = db.query(User).filter(func.lower(User.email) == email).first()
        if user is None:
            user = User(
                full_name=name,
                email=email,
                username=email,
                hashed_password=get_password_hash("123456"),
                role="expert",
                phone="9000000004" if email == "expert1@agro.com" else "9000000005",
            )
            db.add(user)
            db.flush()

        expert = db.query(Expert).filter(Expert.user_id == user.id).first()
        if expert is None:
            expert = Expert(
                user_id=user.id,
                specialization="General Agriculture",
                bio="Auto-created expert profile",
                approval_status="approved",
                is_active=True,
            )
            db.add(expert)
            db.flush()

    return (
        db.query(Expert)
        .join(User, Expert.user_id == User.id)
        .filter(func.lower(User.email).in_(["expert1@agro.com", "expert2@agro.com"]))
        .all()
    )


def reset_seed_records(db: Session) -> None:
    db.query(Job).filter(
        Job.title.ilike("[DEMO_JOB]%") | Job.title.ilike(f"{SEED_MARKERS['job']}%")
    ).delete(synchronize_session=False)
    db.query(Worker).filter(
        Worker.name.ilike("[DEMO_WORKER]%") | Worker.name.ilike(f"{SEED_MARKERS['worker']}%")
    ).delete(synchronize_session=False)
    db.query(Equipment).filter(
        Equipment.name.ilike("[DEMO_EQUIPMENT]%") | Equipment.name.ilike(f"{SEED_MARKERS['equipment']}%")
    ).delete(synchronize_session=False)
    db.query(FarmingTechnique).filter(
        FarmingTechnique.title.ilike("[DEMO_TECHNIQUE]%") | FarmingTechnique.title.ilike(f"{SEED_MARKERS['technique']}%")
    ).delete(synchronize_session=False)


def seed_jobs(db: Session, farmer_ids: list[int]) -> int:
    jobs = [
        ("Harvest Support Team", "Need labor support for wheat harvest and bundling.", 700.0, "Ludhiana, Punjab", "10 days", "open"),
        ("Drip Irrigation Repair", "Repair and maintenance for drip line leakages.", 900.0, "Patiala, Punjab", "3 days", "active"),
        ("Paddy Transplanting Crew", "Seasonal workers required for paddy transplantation.", 650.0, "Patna, Bihar", "7 days", "open"),
        ("Orchard Pruning Work", "Skilled hands needed for apple orchard pruning.", 800.0, "Shimla Border, HP", "5 days", "active"),
        ("Soil Bed Preparation", "Field leveling and soil bed prep before sowing.", 600.0, "Sangrur, Punjab", "4 days", "open"),
    ]

    for idx, (title, description, wage, location, duration, status) in enumerate(jobs, start=1):
        db.add(
            Job(
                farmer_id=farmer_ids[idx % len(farmer_ids)],
                title=f"{SEED_MARKERS['job']} {idx} - {title}",
                description=description,
                wage=wage,
                location=location,
                duration=duration,
                status=status,
            )
        )

    return len(jobs)


def seed_workers(db: Session) -> int:
    workers = [
        ("Ravi Kumar", "9811100011", "3 years", "Harvesting, Ploughing", "Ludhiana", "available"),
        ("Suresh Lal", "9811100012", "5 years", "Irrigation, Spraying", "Patiala", "available"),
        ("Manoj Singh", "9811100013", "2 years", "Transplanting, Weeding", "Patna", "looking_for_work"),
        ("Deepak Rai", "9811100014", "6 years", "Tractor driving, Loading", "Moga", "busy"),
        ("Ramesh Das", "9811100015", "4 years", "Orchard care, Pruning", "Shimla", "available"),
        ("Amit Yadav", "9811100016", "7 years", "Field prep, Harvest ops", "Sangrur", "looking_for_work"),
    ]

    for idx, (name, contact, experience, skills, location, availability) in enumerate(workers, start=1):
        db.add(
            Worker(
                name=f"{SEED_MARKERS['worker']} {idx} - {name}",
                contact=contact,
                experience=experience,
                skills=skills,
                location=location,
                bio="Worker profile for employment module testing",
                availability_status=availability,
                is_blocked=False,
            )
        )

    return len(workers)


def seed_equipment(db: Session, farmer_ids: list[int]) -> int:
    equipment_catalog = [
        ("Tractor 45HP", 3500.0, "good"),
        ("Mini Tractor", 2500.0, "good"),
        ("Rotavator", 1800.0, "good"),
        ("Seed Drill", 1600.0, "good"),
        ("Disc Harrow", 1700.0, "fair"),
        ("Cultivator", 1400.0, "good"),
        ("Power Tiller", 1900.0, "good"),
        ("Sprayer 200L", 900.0, "good"),
        ("Boom Sprayer", 1300.0, "fair"),
        ("Happy Seeder", 2200.0, "good"),
        ("Straw Reaper", 2600.0, "good"),
        ("Combine Harvester", 6500.0, "good"),
        ("Baler Machine", 3000.0, "fair"),
        ("Water Tanker", 1200.0, "good"),
        ("Drip Kit Set", 800.0, "good"),
        ("Mulcher", 2000.0, "good"),
        ("Potato Digger", 2800.0, "fair"),
        ("Rice Transplanter", 3200.0, "good"),
        ("Threshing Machine", 2100.0, "good"),
        ("Laser Leveller", 4000.0, "good"),
    ]
    locations = [
        "Ludhiana, Punjab",
        "Patiala, Punjab",
        "Bathinda, Punjab",
        "Patna, Bihar",
        "Muzaffarpur, Bihar",
    ]

    for idx, (name, rent, condition) in enumerate(equipment_catalog, start=1):
        db.add(
            Equipment(
                name=f"{SEED_MARKERS['equipment']} {idx} - {name}",
                description=f"Rental equipment listing: {name}",
                owner_id=farmer_ids[idx % len(farmer_ids)],
                daily_rent=rent,
                location=locations[idx % len(locations)],
                is_available=(idx % 5 != 0),
                is_approved=True,
                condition=condition,
            )
        )

    return len(equipment_catalog)


def seed_techniques(db: Session, expert_ids: list[int]) -> int:
    categories = ["soil", "irrigation", "pest", "fertilizer", "crop-management", "post-harvest"]
    techniques = [
        ("Soil Testing Before Sowing", "Collect composite soil samples and adjust nutrients as per report.", "soil", "Wheat"),
        ("Raised Bed Plantation", "Use raised beds to improve drainage and root aeration.", "soil", "Vegetables"),
        ("Drip Scheduling by Crop Stage", "Adjust drip irrigation interval based on growth stage and weather.", "irrigation", "Tomato"),
        ("Mulch for Moisture Conservation", "Apply organic mulch to reduce evaporation and weed pressure.", "irrigation", "Chili"),
        ("Yellow Sticky Trap Deployment", "Install sticky traps for monitoring and reducing sap-sucking pests.", "pest", "Cotton"),
        ("Pheromone Trap Rotation", "Rotate lures every 3-4 weeks to maintain trapping efficiency.", "pest", "Brinjal"),
        ("Split Nitrogen Application", "Apply nitrogen in 3 splits for better uptake and lower loss.", "fertilizer", "Rice"),
        ("Micronutrient Foliar Spray", "Use zinc and boron sprays during deficiency windows.", "fertilizer", "Maize"),
        ("Seed Treatment Protocol", "Treat seeds with fungicide and bio-inoculants before sowing.", "crop-management", "Gram"),
        ("Integrated Weed Management", "Combine mechanical weeding with pre-emergence herbicide.", "crop-management", "Soybean"),
        ("Canopy Pruning Strategy", "Prune orchard canopy for light penetration and disease control.", "crop-management", "Apple"),
        ("Preventive Fungicide Calendar", "Plan preventive sprays according to disease forecast.", "pest", "Potato"),
        ("Farmyard Manure Composting", "Compost manure properly to improve organic carbon.", "soil", "All Crops"),
        ("Leaf Color Chart Nitrogen Check", "Use LCC readings to decide top dressing in paddy.", "fertilizer", "Rice"),
        ("Rainwater Harvesting Trenches", "Create contour trenches to capture runoff in uplands.", "irrigation", "Rainfed Areas"),
        ("Harvest Maturity Indexing", "Harvest at physiological maturity for better quality and shelf life.", "post-harvest", "Banana"),
        ("Grading and Sorting Workflow", "Sort produce by size and quality for premium market pricing.", "post-harvest", "Onion"),
        ("Safe Storage Moisture Targets", "Dry produce to safe moisture levels before storage.", "post-harvest", "Wheat"),
    ]

    for idx, (title, description, category, crop_type) in enumerate(techniques, start=1):
        db.add(
            FarmingTechnique(
                title=f"{SEED_MARKERS['technique']} {idx} - {title}",
                description=description,
                category=category if category in categories else random.choice(categories),
                crop_type=crop_type,
                expert_id=expert_ids[idx % len(expert_ids)],
                is_featured=(idx % 4 == 0),
            )
        )

    return len(techniques)


def seed_raw_feature_data() -> None:
    Base.metadata.create_all(bind=ENGINE)

    db = SessionLocal()
    try:
        farmer_primary = ensure_seed_farmer(db)

        # Ensure at least 2 farmer profiles for ownership distribution.
        farmer_ids = [farmer_primary.id]
        farmer2 = db.query(Farmer).join(User, Farmer.user_id == User.id).filter(func.lower(User.email) == "farmer2@agro.com").first()
        if farmer2:
            farmer_ids.append(farmer2.id)
        else:
            farmer_ids.append(farmer_primary.id)

        experts = ensure_seed_experts(db)
        expert_ids = [expert.id for expert in experts] or [1]

        reset_seed_records(db)

        jobs_count = seed_jobs(db, farmer_ids)
        workers_count = seed_workers(db)
        equipment_count = seed_equipment(db, farmer_ids)
        techniques_count = seed_techniques(db, expert_ids)

        db.commit()

        print("Raw feature data seeded successfully.")
        print(f"Employment/Jobs: {jobs_count}")
        print(f"Workers: {workers_count}")
        print(f"Equipment Rental: {equipment_count}")
        print(f"Farming Techniques: {techniques_count}")
    except Exception as exc:
        db.rollback()
        raise RuntimeError(f"Seeding failed: {exc}") from exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_raw_feature_data()
