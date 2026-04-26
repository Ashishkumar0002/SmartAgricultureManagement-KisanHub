"""
Seed data for SAMS (Smart Agriculture Management System).

Features:
- Async entrypoint (works with current sync SQLAlchemy stack via asyncio.to_thread)
- Deterministic reseed (drops and recreates schema)
- Bcrypt password hashing for seeded login users
- Relational data for Admin, Farmer, Expert, Job, Application, Advisory, Equipment, Analytics paths

Run:
    cd backend
    python seed_data.py
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

from passlib.hash import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Ensure local app package is importable when running from backend directory.
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.db import Base
from app.models import (
    ActivityLog,
    Advisory,
    AdvisoryMessage,
    Alert,
    Application,
    Content,
    Crop,
    CropInfo,
    Expert,
    ExpertAssignment,
    Equipment,
    Farmer,
    FarmingTechnique,
    Job,
    MarketPrice,
    MarketSale,
    User,
    Worker,
)

# Keep compatibility with sqlite and postgres URLs from project settings.
DATABASE_URL = settings.database_url
ENGINE = create_engine(
    DATABASE_URL,
    future=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)


def hash_password(password: str) -> str:
    """Create bcrypt hash for seeded credentials."""
    return bcrypt.hash(password)


def create_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    username: str,
    password: str,
    role: str,
    phone: str | None = None,
) -> User:
    user = User(
        full_name=full_name,
        email=email,
        username=username,
        hashed_password=hash_password(password),
        role=role,
        phone=phone,
    )
    db.add(user)
    db.flush()
    return user


def seed_sync() -> None:
    """Synchronous seeding logic executed from async wrapper."""
    Base.metadata.drop_all(bind=ENGINE)
    Base.metadata.create_all(bind=ENGINE)

    db = SessionLocal()
    try:
        print("Starting SAMS database seed...")

        # ---------------------------------------------------------------------
        # 1) Users and role profiles
        # ---------------------------------------------------------------------
        admin = create_user(
            db,
            full_name="System Admin",
            email="admin@agro.com",
            username="admin@agro.com",
            password="admin123",
            role="admin",
            phone="9000000001",
        )

        farmer_user_1 = create_user(
            db,
            full_name="Farmer One",
            email="farmer1@agro.com",
            username="farmer_one",
            password="123456",
            role="farmer",
            phone="9000000002",
        )
        farmer_user_2 = create_user(
            db,
            full_name="Farmer Two",
            email="farmer2@agro.com",
            username="farmer_two",
            password="123456",
            role="farmer",
            phone="9000000003",
        )

        expert_user_1 = create_user(
            db,
            full_name="Expert Crop Disease",
            email="expert1@agro.com",
            username="expert_crop_disease",
            password="123456",
            role="expert",
            phone="9000000004",
        )
        expert_user_2 = create_user(
            db,
            full_name="Expert Soil Fertility",
            email="expert2@agro.com",
            username="expert_soil_fertility",
            password="123456",
            role="expert",
            phone="9000000005",
        )

        farmer_1 = Farmer(
            user_id=farmer_user_1.id,
            name="Farmer One",
            location="Rampur Village, Punjab",
            total_land=6.5,
            soil_type="loamy",
            irrigation_type="drip",
            state="Punjab",
            district="Ludhiana",
            village="Rampur",
            water_source="Canal",
            crop_variety="Wheat, Apple",
            crop_types="Wheat, Apple",
            farming_experience_years=11,
            annual_income_range="5-8 lakh",
        )
        farmer_2 = Farmer(
            user_id=farmer_user_2.id,
            name="Farmer Two",
            location="Shivpur Village, Bihar",
            total_land=4.0,
            soil_type="clay",
            irrigation_type="flood",
            state="Bihar",
            district="Patna",
            village="Shivpur",
            water_source="Tube well",
            crop_variety="Rice",
            crop_types="Rice",
            farming_experience_years=8,
            annual_income_range="3-5 lakh",
        )
        db.add_all([farmer_1, farmer_2])
        db.flush()

        expert_1 = Expert(
            user_id=expert_user_1.id,
            specialization="Crop Disease",
            bio="Specialist in fungal and pest disease diagnostics.",
            years_of_experience=9,
            qualification="MSc Plant Pathology",
            working_organization="State Agriculture Board",
            service_areas="Punjab, Haryana",
            languages_known="English,Hindi,Punjabi",
            approval_status="approved",
            is_active=True,
            rating=4.6,
        )
        expert_2 = Expert(
            user_id=expert_user_2.id,
            specialization="Soil & Fertility",
            bio="Expert in soil health, fertility restoration, and nutrient plans.",
            years_of_experience=12,
            qualification="MSc Soil Science",
            working_organization="National Soil Mission",
            service_areas="Bihar, UP",
            languages_known="English,Hindi",
            approval_status="approved",
            is_active=True,
            rating=4.8,
        )
        db.add_all([expert_1, expert_2])
        db.flush()

        # ---------------------------------------------------------------------
        # 2) Farm and crop data
        # ---------------------------------------------------------------------
        crops = [
            Crop(name="Wheat", season="Rabi", area=3.0, farmer_id=farmer_1.id),
            Crop(name="Apple", season="Kharif", area=1.5, farmer_id=farmer_1.id),
            Crop(name="Rice", season="Kharif", area=2.8, farmer_id=farmer_2.id),
        ]
        db.add_all(crops)
        db.flush()

        # ---------------------------------------------------------------------
        # 2b) Crop information library (farmer dashboard knowledge base)
        # ---------------------------------------------------------------------
        crop_info_items = [
            CropInfo(
                name="Wheat",
                crop_type="Grain",
                climate_requirements="Cool growing season, 15-25C with low humidity at maturity",
                soil_type="Well-drained loam to clay loam, pH 6.0-7.5",
                sowing_season="October-November",
                harvesting_time="March-April",
                production_steps="Land prep, seed treatment, line sowing, irrigation at CRI, weed control, timely harvest",
                best_practices="Use certified seeds, split nitrogen dose, monitor rust early",
                water_requirements="450-650 mm per season",
                fertilizer_recommendations="NPK 120:60:40 kg/ha with micronutrients as needed",
                pest_disease_prevention="Seed treatment and preventive fungicide spray for rust",
                expected_yield="4-5.5 tons/ha",
                market_tips="Sell in graded lots and track MSP announcements",
            ),
            CropInfo(
                name="Rice",
                crop_type="Grain",
                climate_requirements="Warm humid climate, 20-35C, high water availability",
                soil_type="Clayey to loamy soils with good water retention",
                sowing_season="June-July",
                harvesting_time="October-November",
                production_steps="Nursery raising, transplanting, puddling, fertilizer split, pest watch",
                best_practices="Use short-duration varieties where water is limited",
                water_requirements="1200-1600 mm per season",
                fertilizer_recommendations="NPK 100:50:50 kg/ha plus zinc in deficient soils",
                pest_disease_prevention="Adopt IPM and field sanitation",
                expected_yield="4-6 tons/ha",
                market_tips="Dry grain to safe moisture before sale",
            ),
            CropInfo(
                name="Maize",
                crop_type="Grain",
                climate_requirements="Moderate temperatures, 18-30C, bright sunlight",
                soil_type="Fertile, well-drained loamy soils",
                sowing_season="June-July and January-February",
                harvesting_time="September-October and May-June",
                production_steps="Seed treatment, line sowing, gap filling, top dressing, ear harvest",
                best_practices="Maintain optimum plant population and timely weeding",
                water_requirements="500-800 mm per season",
                fertilizer_recommendations="NPK 150:75:40 kg/ha, split nitrogen",
                pest_disease_prevention="Control stem borer with pheromone traps and scouting",
                expected_yield="5-7 tons/ha",
                market_tips="Prefer collective selling for better negotiation",
            ),
            CropInfo(
                name="Mustard",
                crop_type="Oilseed",
                climate_requirements="Cool dry climate, 10-25C",
                soil_type="Loam to sandy loam, pH 6.0-7.5",
                sowing_season="October-November",
                harvesting_time="February-March",
                production_steps="Fine seedbed, line sowing, thinning, nutrient top-up, harvest at maturity",
                best_practices="Avoid late sowing to reduce aphid pressure",
                water_requirements="250-400 mm per season",
                fertilizer_recommendations="NPK 80:40:40 kg/ha with sulfur",
                pest_disease_prevention="Monitor aphids and use threshold-based spray",
                expected_yield="1.2-2.0 tons/ha",
                market_tips="Clean seed well for better oil mill rates",
            ),
            CropInfo(
                name="Sugarcane",
                crop_type="Cash Crop",
                climate_requirements="Tropical to subtropical, 20-35C",
                soil_type="Deep rich loam with good drainage",
                sowing_season="February-March and September-October",
                harvesting_time="10-14 months after planting",
                production_steps="Sett treatment, furrow planting, earthing up, ratoon management",
                best_practices="Adopt drip fertigation for higher sugar recovery",
                water_requirements="1500-2500 mm annually",
                fertilizer_recommendations="NPK 250:115:115 kg/ha with organic manure",
                pest_disease_prevention="Use healthy setts and rogue diseased clumps",
                expected_yield="70-100 tons/ha",
                market_tips="Supply quickly after harvest to avoid sucrose loss",
            ),
            CropInfo(
                name="Cotton",
                crop_type="Cash Crop",
                climate_requirements="Warm climate, 21-30C and dry weather at boll opening",
                soil_type="Black cotton soils or fertile loams",
                sowing_season="April-May",
                harvesting_time="October-January",
                production_steps="Seed treatment, line sowing, square retention care, boll management",
                best_practices="Use refuge rows and balanced nutrients",
                water_requirements="700-1300 mm per season",
                fertilizer_recommendations="NPK 100:50:50 kg/ha with split application",
                pest_disease_prevention="Follow IPM and pheromone trap schedule",
                expected_yield="2-3 tons seed cotton/ha",
                market_tips="Separate clean kapas lots by grade",
            ),
            CropInfo(
                name="Potato",
                crop_type="Vegetable",
                climate_requirements="Cool climate, 15-25C",
                soil_type="Loose friable loam rich in organic matter",
                sowing_season="October-November",
                harvesting_time="January-March",
                production_steps="Seed tuber treatment, ridge planting, earthing up, haulm cutting",
                best_practices="Irrigate lightly and frequently during tuber bulking",
                water_requirements="500-700 mm per season",
                fertilizer_recommendations="NPK 180:80:100 kg/ha plus FYM",
                pest_disease_prevention="Late blight surveillance and preventive fungicides",
                expected_yield="20-30 tons/ha",
                market_tips="Store in ventilated cool rooms to reduce losses",
            ),
            CropInfo(
                name="Tomato",
                crop_type="Vegetable",
                climate_requirements="Mild climate, 18-30C",
                soil_type="Well-drained loamy soils, pH 6.0-7.0",
                sowing_season="Year-round with regional windows",
                harvesting_time="70-90 days after transplant",
                production_steps="Nursery, transplanting, staking, pruning, nutrient schedule",
                best_practices="Mulching and drip irrigation improve fruit quality",
                water_requirements="400-600 mm per season",
                fertilizer_recommendations="NPK 120:60:60 kg/ha with calcium sprays",
                pest_disease_prevention="Use sticky traps and rotate fungicides",
                expected_yield="30-50 tons/ha",
                market_tips="Harvest at breaker stage for long-distance transport",
            ),
            CropInfo(
                name="Onion",
                crop_type="Vegetable",
                climate_requirements="Mild temperature for vegetative growth, dry at maturity",
                soil_type="Sandy loam to loam with good drainage",
                sowing_season="October-December",
                harvesting_time="March-May",
                production_steps="Nursery, transplanting, weed control, neck fall harvest",
                best_practices="Cure bulbs properly before storage",
                water_requirements="350-550 mm per season",
                fertilizer_recommendations="NPK 100:50:50 kg/ha with sulfur",
                pest_disease_prevention="Manage thrips and purple blotch proactively",
                expected_yield="20-25 tons/ha",
                market_tips="Store in ventilated stacks and sell during lean period",
            ),
            CropInfo(
                name="Chili",
                crop_type="Vegetable",
                climate_requirements="Warm climate, 20-30C",
                soil_type="Well-drained loamy soils",
                sowing_season="June-July and January-February",
                harvesting_time="90-120 days after transplant",
                production_steps="Nursery, transplanting, pinching, split fertigation",
                best_practices="Use disease-resistant varieties and drip lines",
                water_requirements="600-800 mm per season",
                fertilizer_recommendations="NPK 120:60:60 kg/ha with micronutrients",
                pest_disease_prevention="Control mites, thrips, and viral vectors",
                expected_yield="8-12 tons green pods/ha",
                market_tips="Grade by size/color for premium rates",
            ),
            CropInfo(
                name="Cabbage",
                crop_type="Vegetable",
                climate_requirements="Cool humid weather, 15-25C",
                soil_type="Fertile loam with high organic matter",
                sowing_season="September-November",
                harvesting_time="December-March",
                production_steps="Nursery, transplanting, top dressing, head formation care",
                best_practices="Maintain regular moisture to avoid head cracking",
                water_requirements="380-500 mm per season",
                fertilizer_recommendations="NPK 120:60:60 kg/ha with boron",
                pest_disease_prevention="Use net cover and neem-based sprays early",
                expected_yield="35-50 tons/ha",
                market_tips="Harvest compact heads and avoid rough handling",
            ),
            CropInfo(
                name="Cauliflower",
                crop_type="Vegetable",
                climate_requirements="Cool season crop, 15-22C ideal",
                soil_type="Well-drained fertile loam",
                sowing_season="September-November",
                harvesting_time="December-February",
                production_steps="Nursery, transplanting, blanching, curd protection",
                best_practices="Select maturity group variety as per season",
                water_requirements="350-500 mm per season",
                fertilizer_recommendations="NPK 120:80:60 kg/ha",
                pest_disease_prevention="Scout for diamondback moth and downy mildew",
                expected_yield="25-35 tons/ha",
                market_tips="Harvest compact white curds for better demand",
            ),
            CropInfo(
                name="Brinjal",
                crop_type="Vegetable",
                climate_requirements="Warm climate, 22-30C",
                soil_type="Sandy loam to loam, rich in organic matter",
                sowing_season="July-September and January-February",
                harvesting_time="90-120 days after transplant",
                production_steps="Nursery, transplanting, staking, regular picking",
                best_practices="Use pheromone traps against shoot and fruit borer",
                water_requirements="500-700 mm per season",
                fertilizer_recommendations="NPK 120:60:60 kg/ha",
                pest_disease_prevention="Remove infested shoots and rotate insecticides",
                expected_yield="25-40 tons/ha",
                market_tips="Frequent harvest improves fruit quality and price",
            ),
            CropInfo(
                name="Okra",
                crop_type="Vegetable",
                climate_requirements="Warm season, 24-32C",
                soil_type="Well-drained loam to sandy loam",
                sowing_season="February-March and June-July",
                harvesting_time="45-60 days after sowing onwards",
                production_steps="Line sowing, thinning, top dressing, regular plucking",
                best_practices="Harvest tender pods every 2-3 days",
                water_requirements="400-600 mm per season",
                fertilizer_recommendations="NPK 100:50:50 kg/ha",
                pest_disease_prevention="Control jassids/whitefly and remove diseased plants",
                expected_yield="10-15 tons/ha",
                market_tips="Sort by pod length for better market segmentation",
            ),
            CropInfo(
                name="Pea",
                crop_type="Pulse",
                climate_requirements="Cool season, 10-25C",
                soil_type="Well-drained loam with pH 6.0-7.5",
                sowing_season="October-November",
                harvesting_time="January-March",
                production_steps="Seed inoculation, line sowing, support where needed, harvest",
                best_practices="Use rhizobium inoculation for better nodulation",
                water_requirements="300-450 mm per season",
                fertilizer_recommendations="NPK 25:50:25 kg/ha",
                pest_disease_prevention="Manage powdery mildew with timely spray",
                expected_yield="6-10 tons green pods/ha",
                market_tips="Pick at optimum maturity for sweetness",
            ),
            CropInfo(
                name="Gram",
                crop_type="Pulse",
                climate_requirements="Cool dry climate, 15-25C",
                soil_type="Well-drained sandy loam to clay loam",
                sowing_season="October-November",
                harvesting_time="February-March",
                production_steps="Seed treatment, line sowing, moisture conservation, harvest",
                best_practices="Prefer residual moisture fields for low-input cultivation",
                water_requirements="250-350 mm per season",
                fertilizer_recommendations="NPK 20:40:20 kg/ha with sulfur",
                pest_disease_prevention="Monitor pod borer and wilt incidence",
                expected_yield="1.5-2.5 tons/ha",
                market_tips="Clean and bag uniformly for bulk buyers",
            ),
            CropInfo(
                name="Moong",
                crop_type="Pulse",
                climate_requirements="Warm climate, 25-35C",
                soil_type="Sandy loam with good drainage",
                sowing_season="March-April and June-July",
                harvesting_time="60-75 days after sowing",
                production_steps="Line sowing, weed control, one irrigation at flowering",
                best_practices="Short-duration variety fits between two major crops",
                water_requirements="250-300 mm per season",
                fertilizer_recommendations="NPK 20:40:20 kg/ha",
                pest_disease_prevention="Monitor whitefly and yellow mosaic virus",
                expected_yield="0.8-1.2 tons/ha",
                market_tips="Timely harvest avoids shattering losses",
            ),
            CropInfo(
                name="Groundnut",
                crop_type="Oilseed",
                climate_requirements="Warm climate, 25-30C",
                soil_type="Sandy loam to loam, well-drained",
                sowing_season="June-July and October-November",
                harvesting_time="100-120 days after sowing",
                production_steps="Seed treatment, line sowing, gypsum at pegging, harvest",
                best_practices="Avoid waterlogging during pegging stage",
                water_requirements="500-700 mm per season",
                fertilizer_recommendations="NPK 20:40:40 kg/ha with calcium",
                pest_disease_prevention="Use resistant varieties against leaf spot",
                expected_yield="2-3 tons pods/ha",
                market_tips="Dry pods to safe moisture before storage",
            ),
            CropInfo(
                name="Soybean",
                crop_type="Oilseed",
                climate_requirements="Warm and humid climate, 20-30C",
                soil_type="Well-drained fertile loam",
                sowing_season="June-July",
                harvesting_time="October-November",
                production_steps="Rhizobium inoculation, line sowing, weed-free early growth",
                best_practices="Early weeding in first 30 days is critical",
                water_requirements="450-700 mm per season",
                fertilizer_recommendations="NPK 20:60:40 kg/ha",
                pest_disease_prevention="Monitor girdle beetle and rust",
                expected_yield="2-3 tons/ha",
                market_tips="Store in dry condition to maintain oil quality",
            ),
            CropInfo(
                name="Banana",
                crop_type="Fruit",
                climate_requirements="Tropical climate, 20-35C",
                soil_type="Deep well-drained loam with rich organic matter",
                sowing_season="Year-round with irrigation",
                harvesting_time="11-13 months after planting",
                production_steps="Pit planting, sucker management, fertigation, bunch care",
                best_practices="Use tissue culture plants for uniform stands",
                water_requirements="1200-2200 mm annually",
                fertilizer_recommendations="High potassium schedule with organic inputs",
                pest_disease_prevention="Control sigatoka and pseudostem borer",
                expected_yield="40-60 tons/ha",
                market_tips="Harvest by maturity grade and use careful packing",
            ),
        ]
        db.add_all(crop_info_items)
        db.flush()

        # ---------------------------------------------------------------------
        # 3) Advisory and responses
        # ---------------------------------------------------------------------
        advisory_1 = Advisory(
            farmer_id=farmer_1.id,
            expert_id=expert_1.id,
            question="Wheat leaves show brown rust spots. What treatment should I use?",
            response="Use propiconazole spray in two rounds, 7 days apart.",
            status="answered",
        )
        advisory_2 = Advisory(
            farmer_id=farmer_2.id,
            expert_id=expert_2.id,
            question="Rice yield dropped this season despite normal rainfall. Soil looks weak.",
            response="Apply balanced NPK with organic compost and test pH before next cycle.",
            status="answered",
        )
        db.add_all([advisory_1, advisory_2])
        db.flush()

        db.add_all(
            [
                AdvisoryMessage(
                    advisory_id=advisory_1.id,
                    sender_id=farmer_user_1.id,
                    message="Spots increased after recent humidity.",
                    is_from_expert=False,
                ),
                AdvisoryMessage(
                    advisory_id=advisory_1.id,
                    sender_id=expert_user_1.id,
                    message="Immediate fungicide application is recommended.",
                    is_from_expert=True,
                ),
                AdvisoryMessage(
                    advisory_id=advisory_2.id,
                    sender_id=expert_user_2.id,
                    message="Focus on zinc and organic matter in next preparation.",
                    is_from_expert=True,
                ),
            ]
        )

        db.add_all(
            [
                ExpertAssignment(
                    advisory_id=advisory_1.id,
                    expert_id=expert_1.id,
                    assigned_by=admin.id,
                    status="completed",
                    completion_date=datetime.now(timezone.utc),
                ),
                ExpertAssignment(
                    advisory_id=advisory_2.id,
                    expert_id=expert_2.id,
                    assigned_by=admin.id,
                    status="completed",
                    completion_date=datetime.now(timezone.utc),
                ),
            ]
        )

        # ---------------------------------------------------------------------
        # 4) Equipment
        # ---------------------------------------------------------------------
        db.add_all(
            [
                Equipment(
                    name="Tractor",
                    description="45 HP tractor for ploughing and hauling",
                    owner_id=farmer_1.id,
                    daily_rent=3500,
                    location="Rampur Village, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Harvester",
                    description="Combine harvester suitable for wheat",
                    owner_id=farmer_1.id,
                    daily_rent=6000,
                    location="Ludhiana, Punjab",
                    is_available=False,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Sprayer",
                    description="Motorized pesticide sprayer",
                    owner_id=farmer_2.id,
                    daily_rent=900,
                    location="Shivpur Village, Bihar",
                    is_available=True,
                    is_approved=True,
                    condition="fair",
                ),
                Equipment(
                    name="Rotavator",
                    description="Heavy-duty rotavator for seedbed preparation",
                    owner_id=farmer_1.id,
                    daily_rent=1800,
                    location="Rampur Village, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Seed Drill",
                    description="Precision seed drill for wheat and mustard sowing",
                    owner_id=farmer_1.id,
                    daily_rent=1400,
                    location="Ludhiana, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Laser Land Leveler",
                    description="Laser leveling unit for uniform irrigation",
                    owner_id=farmer_1.id,
                    daily_rent=4200,
                    location="Moga, Punjab",
                    is_available=False,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Power Weeder",
                    description="Inter-row weeder suitable for vegetable crops",
                    owner_id=farmer_1.id,
                    daily_rent=950,
                    location="Rampur Village, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="fair",
                ),
                Equipment(
                    name="Mini Tiller",
                    description="Compact tiller for small plots and orchards",
                    owner_id=farmer_2.id,
                    daily_rent=1100,
                    location="Shivpur Village, Bihar",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Reaper",
                    description="Crop reaper for fast paddy and wheat cutting",
                    owner_id=farmer_2.id,
                    daily_rent=3000,
                    location="Patna Rural",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Threshing Machine",
                    description="Portable thresher for grain separation",
                    owner_id=farmer_2.id,
                    daily_rent=2500,
                    location="Shivpur Village, Bihar",
                    is_available=False,
                    is_approved=True,
                    condition="fair",
                ),
                Equipment(
                    name="Water Pump Set",
                    description="Diesel pump set for emergency irrigation",
                    owner_id=farmer_2.id,
                    daily_rent=700,
                    location="Patna Rural",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Mulching Laying Machine",
                    description="Machine for laying mulch sheets in horticulture fields",
                    owner_id=farmer_1.id,
                    daily_rent=1900,
                    location="Ludhiana, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
                Equipment(
                    name="Boom Sprayer",
                    description="Tractor-mounted boom sprayer for large fields",
                    owner_id=farmer_1.id,
                    daily_rent=2200,
                    location="Bathinda, Punjab",
                    is_available=True,
                    is_approved=True,
                    condition="fair",
                ),
                Equipment(
                    name="Post-Hole Digger",
                    description="Auger machine for orchard post installation",
                    owner_id=farmer_2.id,
                    daily_rent=850,
                    location="Shivpur Village, Bihar",
                    is_available=True,
                    is_approved=True,
                    condition="good",
                ),
            ]
        )

        # ---------------------------------------------------------------------
        # 5) Jobs and applications
        # ---------------------------------------------------------------------
        job_harvest_approved = Job(
            farmer_id=farmer_1.id,
            title="Harvesting Job",
            description="Need 3 workers for wheat harvesting and bundling.",
            location="Rampur Village, Punjab",
            wage=700,
            duration="7 days",
            status="approved",
        )
        job_irrigation_pending = Job(
            farmer_id=farmer_1.id,
            title="Irrigation Job",
            description="Support required for drip line maintenance.",
            location="Ludhiana, Punjab",
            wage=500,
            duration="5 days",
            status="pending",
        )
        job_orchard_rejected = Job(
            farmer_id=farmer_2.id,
            title="Apple Orchard Support",
            description="Pruning and orchard floor cleanup.",
            location="Shivpur Village, Bihar",
            wage=550,
            duration="4 days",
            status="rejected",
        )
        job_sorting_approved = Job(
            farmer_id=farmer_2.id,
            title="Post-Harvest Sorting",
            description="Need sorting and grading support for produce dispatch.",
            location="Patna Rural",
            wage=480,
            duration="3 days",
            status="approved",
        )
        job_soil_prep_open = Job(
            farmer_id=farmer_1.id,
            title="Soil Preparation Team",
            description="Need 4 workers for field leveling, compost mixing and bed setup.",
            location="Rampur Village, Punjab",
            wage=650,
            duration="6 days",
            status="open",
        )
        job_drip_repair_open = Job(
            farmer_id=farmer_1.id,
            title="Drip Line Repair",
            description="Fix and align damaged drip lines in 2-acre vegetable field.",
            location="Ludhiana, Punjab",
            wage=520,
            duration="2 days",
            status="open",
        )
        job_transplanting_active = Job(
            farmer_id=farmer_2.id,
            title="Rice Transplanting Crew",
            description="Need seasonal team for paddy transplanting in wet fields.",
            location="Shivpur Village, Bihar",
            wage=600,
            duration="8 days",
            status="active",
        )
        job_packaging_closed = Job(
            farmer_id=farmer_2.id,
            title="Vegetable Packaging Support",
            description="Help with sorting, packing, and loading produce crates.",
            location="Patna Rural",
            wage=450,
            duration="2 days",
            status="closed",
        )
        db.add_all(
            [
                job_harvest_approved,
                job_irrigation_pending,
                job_orchard_rejected,
                job_sorting_approved,
                job_soil_prep_open,
                job_drip_repair_open,
                job_transplanting_active,
                job_packaging_closed,
            ]
        )
        db.flush()

        db.add_all(
            [
                Application(
                    job_id=job_harvest_approved.id,
                    applicant_id=farmer_user_2.id,
                    message="I can bring one helper and start tomorrow.",
                    status="pending",
                ),
                Application(
                    job_id=job_sorting_approved.id,
                    applicant_id=farmer_user_1.id,
                    message="Experienced with grading and packaging.",
                    status="accepted",
                ),
                Application(
                    job_id=job_harvest_approved.id,
                    applicant_id=expert_user_1.id,
                    message="Available for field supervision support.",
                    status="rejected",
                ),
                Application(
                    job_id=job_soil_prep_open.id,
                    applicant_id=farmer_user_2.id,
                    message="I have experience in compost beds and soil conditioning.",
                    status="pending",
                ),
                Application(
                    job_id=job_drip_repair_open.id,
                    applicant_id=expert_user_2.id,
                    message="Can coordinate a two-person irrigation support team.",
                    status="pending",
                ),
                Application(
                    job_id=job_transplanting_active.id,
                    applicant_id=farmer_user_1.id,
                    message="I can join with three workers from nearby village.",
                    status="accepted",
                ),
            ]
        )

        # Optional worker records to test worker management screens.
        db.add_all(
            [
                Worker(
                    name="Raj Worker",
                    contact="9888811111",
                    experience="5 years harvesting",
                    skills="Harvesting, Field Work",
                    location="Rampur Village",
                    availability_status="available",
                    is_blocked=False,
                ),
                Worker(
                    name="Mina Worker",
                    contact="9888822222",
                    experience="Irrigation and spraying",
                    skills="Irrigation, Spraying",
                    location="Kisan Nagar",
                    availability_status="looking_for_work",
                    is_blocked=False,
                ),
                Worker(
                    name="Sohan Worker",
                    contact="9888833333",
                    experience="3 years field prep",
                    skills="Soil Prep, Transplanting",
                    location="Patna Rural",
                    availability_status="available",
                    is_blocked=False,
                ),
                Worker(
                    name="Pooja Worker",
                    contact="9888844444",
                    experience="4 years irrigation",
                    skills="Drip Repair, Sprinkler Setup",
                    location="Ludhiana",
                    availability_status="looking_for_work",
                    is_blocked=False,
                ),
                Worker(
                    name="Mahesh Worker",
                    contact="9888855555",
                    experience="6 years harvesting crew lead",
                    skills="Harvesting, Team Supervision",
                    location="Rampur Village",
                    availability_status="assigned",
                    assigned_job_id=job_harvest_approved.id,
                    is_blocked=False,
                ),
                Worker(
                    name="Kiran Worker",
                    contact="9888866666",
                    experience="2 years packaging and loading",
                    skills="Packing, Loading, Sorting",
                    location="Shivpur Village",
                    availability_status="available",
                    is_blocked=False,
                ),
                Worker(
                    name="Imran Worker",
                    contact="9888877777",
                    experience="5 years orchard maintenance",
                    skills="Pruning, Orchard Cleanup",
                    location="Patna Rural",
                    availability_status="blocked",
                    is_blocked=True,
                ),
            ]
        )

        # ---------------------------------------------------------------------
        # 6) Market and analytics-like data
        # ---------------------------------------------------------------------
        db.add_all(
            [
                MarketPrice(crop_name="Wheat", price=2320, market_name="Punjab Mandi"),
                MarketPrice(crop_name="Rice", price=2100, market_name="Patna Mandi"),
                MarketPrice(crop_name="Apple", price=4600, market_name="Regional Fruit Hub"),
                MarketPrice(crop_name="Maize", price=1980, market_name="Ludhiana Grain Market"),
                MarketPrice(crop_name="Mustard", price=5750, market_name="Bathinda Mandi"),
            ]
        )

        # Income samples via crop sales.
        db.add_all(
            [
                MarketSale(crop_id=crops[0].id, quantity=24.5, expected_price=56000),
                MarketSale(crop_id=crops[2].id, quantity=30.0, expected_price=63000),
                MarketSale(crop_id=crops[1].id, quantity=8.0, expected_price=36500),
            ]
        )

        # Expense/Income dashboard content entries for testing admin analytics content flows.
        db.add_all(
            [
                Content(
                    title="Expense - Seeds",
                    description="Season seed procurement",
                    category="analytics",
                    location="Rampur Village",
                    content_metadata='{"type":"expense","head":"Seeds","amount":12000}',
                    created_by=admin.id,
                ),
                Content(
                    title="Expense - Fertilizer",
                    description="Urea and micronutrient mix",
                    category="analytics",
                    location="Shivpur Village",
                    content_metadata='{"type":"expense","head":"Fertilizer","amount":18500}',
                    created_by=admin.id,
                ),
                Content(
                    title="Income - Crop Sales",
                    description="Revenue from mandi sales",
                    category="analytics",
                    location="Punjab and Bihar",
                    content_metadata='{"type":"income","head":"Crop Sales","amount":119000}',
                    created_by=admin.id,
                ),
                Content(
                    title="Expense - Labor",
                    description="Weekly worker wages and travel",
                    category="analytics",
                    location="Rampur Village",
                    content_metadata='{"type":"expense","head":"Labor","amount":26500}',
                    created_by=admin.id,
                ),
                Content(
                    title="Income - Equipment Rental",
                    description="Revenue from tractor and sprayer rental",
                    category="analytics",
                    location="Punjab",
                    content_metadata='{"type":"income","head":"Equipment Rental","amount":22000}',
                    created_by=admin.id,
                ),
            ]
        )

        # Extra module data for richer dashboards.
        db.add_all(
            [
                FarmingTechnique(
                    title="Fungal Disease Prevention in Wheat",
                    description="Use resistant seed and preventive spray schedule.",
                    category="disease",
                    crop_type="Wheat",
                    expert_id=expert_1.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Soil Organic Carbon Recovery",
                    description="Integrate compost and green manure in rotation cycles.",
                    category="soil",
                    crop_type="Rice",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Low-Cost Drip Maintenance Routine",
                    description="Monthly flushing, leak checks, and lateral alignment to save water.",
                    category="irrigation",
                    crop_type="Vegetables",
                    expert_id=expert_2.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Direct Seeded Rice Water Saving",
                    description="Adopt alternate wetting and drying to reduce water use in paddy.",
                    category="irrigation",
                    crop_type="Rice",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Integrated Nutrient Plan for Wheat",
                    description="Combine farmyard manure with split NPK applications.",
                    category="fertilizer",
                    crop_type="Wheat",
                    expert_id=expert_2.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Low-Cost Vermicompost Unit",
                    description="Build pit-based vermicompost using crop residue and dung.",
                    category="soil",
                    crop_type="All",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Apple Orchard Pruning Calendar",
                    description="Seasonal pruning schedule for canopy health and higher fruit set.",
                    category="crop_management",
                    crop_type="Apple",
                    expert_id=expert_1.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Yellow Sticky Trap Pest Monitoring",
                    description="Use sticky cards for early pest detection and threshold-based spray.",
                    category="pest",
                    crop_type="Vegetables",
                    expert_id=expert_1.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Seed Treatment Before Sowing",
                    description="Treat seeds with fungicide and bio-inoculants to prevent early disease.",
                    category="disease",
                    crop_type="Wheat",
                    expert_id=expert_1.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Raised Bed Vegetable Cultivation",
                    description="Raised beds improve drainage and root aeration in monsoon.",
                    category="soil",
                    crop_type="Vegetables",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Foliar Micronutrient Spray Window",
                    description="Apply foliar zinc and boron during critical growth stages.",
                    category="fertilizer",
                    crop_type="Rice",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Mulching for Moisture Conservation",
                    description="Use straw and plastic mulch to reduce evaporation and weeds.",
                    category="irrigation",
                    crop_type="Maize",
                    expert_id=expert_2.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Solar Insect Light Trap Setup",
                    description="Install solar traps at field corners to reduce night-flying pests.",
                    category="pest",
                    crop_type="Mustard",
                    expert_id=expert_1.id,
                    is_featured=False,
                ),
                FarmingTechnique(
                    title="Zero Till Wheat After Rice",
                    description="Use zero-till drill to reduce turnaround time and fuel cost.",
                    category="crop_management",
                    crop_type="Wheat",
                    expert_id=expert_1.id,
                    is_featured=True,
                ),
                FarmingTechnique(
                    title="Farm Record Keeping for Profit Tracking",
                    description="Maintain weekly input-output records for better crop planning.",
                    category="management",
                    crop_type="All",
                    expert_id=expert_2.id,
                    is_featured=False,
                ),
                Alert(
                    expert_id=expert_1.id,
                    title="Pest Advisory",
                    description="Rust spread risk is high due to humidity spikes.",
                    alert_type="pest",
                    severity="high",
                    target_regions="Punjab",
                    affected_crops="Wheat",
                    recommendations="Start preventive fungicide cycle now.",
                    is_active=True,
                    expiry_date=datetime.now(timezone.utc) + timedelta(days=14),
                ),
                Alert(
                    expert_id=expert_2.id,
                    title="Soil Moisture Warning",
                    description="Low subsoil moisture reported in adjoining villages.",
                    alert_type="weather",
                    severity="medium",
                    target_regions="Bihar",
                    affected_crops="Rice, Maize",
                    recommendations="Increase mulching and schedule alternate-day irrigation.",
                    is_active=True,
                    expiry_date=datetime.now(timezone.utc) + timedelta(days=10),
                ),
            ]
        )

        # Activity logs to test monitoring pages.
        db.add_all(
            [
                ActivityLog(
                    user_id=admin.id,
                    action="seed",
                    entity_type="system",
                    description="Initial seed completed",
                ),
                ActivityLog(
                    user_id=farmer_user_1.id,
                    action="create",
                    entity_type="job",
                    entity_id=job_harvest_approved.id,
                    description="Created harvesting job",
                ),
                ActivityLog(
                    user_id=farmer_user_2.id,
                    action="create",
                    entity_type="application",
                    description="Applied to harvesting job",
                ),
                ActivityLog(
                    user_id=farmer_user_1.id,
                    action="update",
                    entity_type="job",
                    entity_id=job_drip_repair_open.id,
                    description="Updated wage for drip repair listing",
                ),
                ActivityLog(
                    user_id=expert_user_2.id,
                    action="create",
                    entity_type="technique",
                    description="Published irrigation maintenance technique",
                ),
            ]
        )

        db.commit()

        print("Seed completed successfully.")
        print()
        print("Login credentials:")
        print("1) Admin  : admin@agro.com / admin123")
        print("2) Farmer : farmer1@agro.com / 123456")
        print("3) Farmer : farmer2@agro.com / 123456")
        print("4) Expert : expert1@agro.com / 123456 (Crop Disease)")
        print("5) Expert : expert2@agro.com / 123456 (Soil & Fertility)")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


async def seed_database() -> None:
    """Async entrypoint for seed execution."""
    await asyncio.to_thread(seed_sync)


if __name__ == "__main__":
    asyncio.run(seed_database())
