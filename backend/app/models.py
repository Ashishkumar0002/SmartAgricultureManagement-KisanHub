from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), index=True)  # admin, farmer, expert
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='active', index=True)  # active, suspended, verified
    region: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    last_active: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
        # applications relationship removed to fix SQLAlchemy join error

    farmer_profile = relationship('Farmer', back_populates='user', uselist=False, cascade='all, delete-orphan')
    expert_profile = relationship('Expert', back_populates='user', uselist=False, cascade='all, delete-orphan')


class Farmer(Base):
    __tablename__ = 'farmers'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    location: Mapped[str] = mapped_column(String(160))
    total_land: Mapped[float] = mapped_column(Float)
    soil_type: Mapped[str | None] = mapped_column(String(80), nullable=True)  # clay, loam, sandy, etc
    crop_variety: Mapped[str | None] = mapped_column(String(255), nullable=True)  # comma-separated crops
    irrigation_type: Mapped[str | None] = mapped_column(String(80), nullable=True)  # drip, flood, sprinkler, etc
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)  # file path
    state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    district: Mapped[str | None] = mapped_column(String(120), nullable=True)
    village: Mapped[str | None] = mapped_column(String(120), nullable=True)
    water_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    crop_types: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated list
    current_crops: Mapped[str | None] = mapped_column(Text, nullable=True)
    farming_experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipment_owned: Mapped[str | None] = mapped_column(Text, nullable=True)
    farm_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    soil_ph: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_nitrogen: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_phosphorus: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_potassium: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_moisture: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_health_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    previous_crop: Mapped[str | None] = mapped_column(String(120), nullable=True)
    crop_season: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sowing_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    harvest_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    crop_duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    yield_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    livestock_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_capacity_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    workers_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    annual_income_range: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crops = relationship('Crop', back_populates='farmer', cascade='all, delete-orphan')
    jobs = relationship('Job', back_populates='farmer', cascade='all, delete-orphan')
    user = relationship('User', back_populates='farmer_profile')


class Crop(Base):
    __tablename__ = 'crops'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    season: Mapped[str] = mapped_column(String(60))
    area: Mapped[float] = mapped_column(Float)
    farmer_id: Mapped[int | None] = mapped_column(ForeignKey('farmers.id'), nullable=True)

    farmer = relationship('Farmer', back_populates='crops')


class CropInfo(Base):
    """Crop information library - contains detailed farming knowledge for various crops"""
    __tablename__ = 'crop_info'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True, unique=True)
    crop_type: Mapped[str] = mapped_column(String(60))  # Fruit, Vegetable, Grain, Cash Crop
    climate_requirements: Mapped[str] = mapped_column(Text)  # e.g., "Tropical, 20-30°C"
    soil_type: Mapped[str] = mapped_column(Text)  # e.g., "Well-drained loamy soil"
    sowing_season: Mapped[str] = mapped_column(String(120))  # e.g., "June-July"
    harvesting_time: Mapped[str] = mapped_column(String(120))  # e.g., "October-November"
    production_steps: Mapped[str] = mapped_column(Text)  # Step-by-step guide (JSON format)
    best_practices: Mapped[str] = mapped_column(Text)  # High yield & profit tips
    water_requirements: Mapped[str] = mapped_column(Text)  # e.g., "800-1000mm annually"
    fertilizer_recommendations: Mapped[str] = mapped_column(Text)  # Detailed fertilizer guide
    pest_disease_prevention: Mapped[str] = mapped_column(Text)  # Prevention and control methods
    expected_yield: Mapped[str] = mapped_column(String(120))  # e.g., "50-60 tons per hectare"
    market_tips: Mapped[str] = mapped_column(Text)  # Selling strategy and market information
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Advisory(Base):
    __tablename__ = 'advisory'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question: Mapped[str] = mapped_column(Text)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    farmer_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    expert_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default='pending', index=True)  # pending, assigned, answered
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    images = relationship('AdvisoryImage', back_populates='advisory', cascade='all, delete-orphan')
    messages = relationship('AdvisoryMessage', back_populates='advisory', cascade='all, delete-orphan')


class MarketPrice(Base):
    __tablename__ = 'market_prices'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crop_name: Mapped[str] = mapped_column(String(120))
    price: Mapped[float] = mapped_column(Float)
    market_name: Mapped[str] = mapped_column(String(120))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MarketSale(Base):
    __tablename__ = 'market_sales'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crop_id: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[float] = mapped_column(Float)
    expected_price: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Job(Base):
    __tablename__ = 'jobs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey('farmers.id'), index=True)
    title: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text)
    wage: Mapped[float] = mapped_column(Float)
    location: Mapped[str] = mapped_column(String(160))
    duration: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='open', index=True)  # open, active, rejected, closed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farmer = relationship('Farmer', back_populates='jobs')
    applications = relationship('Application', back_populates='job', cascade='all, delete-orphan')


class Worker(Base):
    __tablename__ = 'workers'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    contact: Mapped[str] = mapped_column(String(80))
    experience: Mapped[str | None] = mapped_column(String(160), nullable=True)
    skills: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    availability_status: Mapped[str] = mapped_column(String(40), default='looking_for_work', index=True)
    assigned_job_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = 'applications'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey('jobs.id'), index=True)
    applicant_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='pending', index=True)  # pending, accepted, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job = relationship('Job', back_populates='applications')
    applicant = relationship('User')


class ActivityLog(Base):
    __tablename__ = 'activity_logs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(100))  # login, logout, create, update, delete
    entity_type: Mapped[str] = mapped_column(String(50))  # user, crop, advisory, etc
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    level: Mapped[str] = mapped_column(String(20), default='info', index=True)  # info, warning, error
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class AnalyticsEvent(Base):
    __tablename__ = 'analytics_events'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    feature: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Content(Base):
    __tablename__ = 'contents'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), index=True)  # weather, market, technique, disease_prevention
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    content_metadata: Mapped[str | None] = mapped_column('metadata', Text, nullable=True)  # JSON string for flexible data
    created_by: Mapped[int] = mapped_column(Integer)  # admin user id
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Equipment(Base):
    __tablename__ = 'equipment'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(ForeignKey('farmers.id'), index=True)  # farmer who owns the equipment
    daily_rent: Mapped[float] = mapped_column(Float)
    location: Mapped[str] = mapped_column(String(160))
    is_available: Mapped[bool] = mapped_column(default=True, index=True)
    is_approved: Mapped[bool] = mapped_column(default=True, index=True)
    condition: Mapped[str] = mapped_column(String(50), default='good')  # good, fair, repair_needed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner = relationship('Farmer', foreign_keys=[owner_id])
    bookings = relationship('EquipmentBooking', back_populates='equipment', cascade='all, delete-orphan')


class ExpertAssignment(Base):
    __tablename__ = 'expert_assignments'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisory_id: Mapped[int] = mapped_column(ForeignKey('advisory.id'), index=True)
    expert_id: Mapped[int] = mapped_column(Integer, index=True)
    assigned_by: Mapped[int] = mapped_column(Integer)  # admin user id
    status: Mapped[str] = mapped_column(String(50), default='pending', index=True)  # pending, assigned, completed
    assignment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completion_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class UserRating(Base):
    __tablename__ = 'user_ratings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rater_id: Mapped[int] = mapped_column(Integer)  # farmer
    rated_user_id: Mapped[int] = mapped_column(Integer)  # expert
    rating: Mapped[int] = mapped_column(Integer)  # 1-5 stars
    review: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AdvisoryImage(Base):
    __tablename__ = 'advisory_images'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisory_id: Mapped[int] = mapped_column(ForeignKey('advisory.id'), index=True)
    image_path: Mapped[str] = mapped_column(String(255))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisory = relationship('Advisory', back_populates='images')


class AdvisoryMessage(Base):
    __tablename__ = 'advisory_messages'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisory_id: Mapped[int] = mapped_column(ForeignKey('advisory.id'), index=True)
    sender_id: Mapped[int] = mapped_column(Integer, index=True)  # farmer or expert
    message: Mapped[str] = mapped_column(Text)
    is_from_expert: Mapped[bool] = mapped_column(default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisory = relationship('Advisory', back_populates='messages')


class FarmingTechnique(Base):
    __tablename__ = 'farming_techniques'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), index=True)  # soil, irrigation, pest, fertilizer, etc
    crop_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    expert_id: Mapped[int] = mapped_column(Integer, index=True)
    featured_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_featured: Mapped[bool] = mapped_column(default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropGuide(Base):
    __tablename__ = 'crop_guides'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crop_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    growth_duration_days: Mapped[int] = mapped_column(Integer)
    water_requirements: Mapped[str] = mapped_column(Text)  # liters/day, frequency, etc
    climate_conditions: Mapped[str] = mapped_column(Text)  # temperature, humidity, rainfall
    fertilizer_usage: Mapped[str] = mapped_column(Text)
    common_diseases: Mapped[str] = mapped_column(Text)  # JSON array with disease names
    prevention_methods: Mapped[str] = mapped_column(Text)  # JSON array with prevention methods
    best_season: Mapped[str] = mapped_column(String(120))
    avg_yield_per_hectare: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EquipmentBooking(Base):
    __tablename__ = 'equipment_bookings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(ForeignKey('equipment.id'), index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey('farmers.id'), index=True)  # renter farmer
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    total_cost: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default='confirmed', index=True)  # confirmed, completed, rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    equipment = relationship('Equipment', back_populates='bookings')
    renter = relationship('Farmer', foreign_keys=[farmer_id])


class Expert(Base):
    __tablename__ = 'experts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    specialization: Mapped[str] = mapped_column(String(120), index=True)  # crop management, soil health, pest control, etc
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    years_of_experience: Mapped[int] = mapped_column(Integer, default=0)
    qualification: Mapped[str | None] = mapped_column(String(160), nullable=True)
    certifications_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    working_organization: Mapped[str | None] = mapped_column(String(160), nullable=True)
    service_areas: Mapped[str | None] = mapped_column(Text, nullable=True)
    languages_known: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_proof_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(30), default='pending', index=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)  # average rating from farmers
    total_queries_resolved: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', back_populates='expert_profile')


class Alert(Base):
    __tablename__ = 'alerts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    expert_id: Mapped[int] = mapped_column(ForeignKey('experts.id'), index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default='pending', index=True)  # pending, approved, rejected
    engagement_count: Mapped[int] = mapped_column(Integer, default=0)
    alert_type: Mapped[str] = mapped_column(String(50), index=True)  # weather, disease, pest, market, etc
    severity: Mapped[str] = mapped_column(String(20), default='medium', index=True)  # low, medium, high, critical
    target_regions: Mapped[str] = mapped_column(Text)  # comma-separated regions or JSON array
    affected_crops: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated or JSON array
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    expert = relationship('Expert')


class FarmImage(Base):
    __tablename__ = 'farm_images'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    image_url: Mapped[str] = mapped_column(String(255))
    crop_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
