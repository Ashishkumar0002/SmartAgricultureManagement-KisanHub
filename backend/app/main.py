from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import inspect, text

from app.core.config import settings
from app.db import Base, engine
from app.routers import advisory, admin, ai, auth, crops, crops_info, employment, farmers, farmer, market, expert

app = FastAPI(title='SAMS API', version='1.0.0')

origins = [origin.strip() for origin in settings.allowed_origins.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_farmer_columns()
    _ensure_worker_columns()
    _ensure_user_columns()
    _ensure_activity_log_columns()
    _ensure_equipment_booking_columns()
    _ensure_alert_columns()
    _normalize_approval_state()


def _ensure_farmer_columns() -> None:
    inspector = inspect(engine)
    if 'farmers' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('farmers')}
    with engine.begin() as connection:
        column_statements = {
            'farm_image': "ALTER TABLE farmers ADD COLUMN farm_image VARCHAR(255)",
            'soil_ph': "ALTER TABLE farmers ADD COLUMN soil_ph FLOAT",
            'soil_nitrogen': "ALTER TABLE farmers ADD COLUMN soil_nitrogen FLOAT",
            'soil_phosphorus': "ALTER TABLE farmers ADD COLUMN soil_phosphorus FLOAT",
            'soil_potassium': "ALTER TABLE farmers ADD COLUMN soil_potassium FLOAT",
            'soil_moisture': "ALTER TABLE farmers ADD COLUMN soil_moisture FLOAT",
            'soil_health_status': "ALTER TABLE farmers ADD COLUMN soil_health_status VARCHAR(20)",
            'previous_crop': "ALTER TABLE farmers ADD COLUMN previous_crop VARCHAR(120)",
            'crop_season': "ALTER TABLE farmers ADD COLUMN crop_season VARCHAR(20)",
            'sowing_date': "ALTER TABLE farmers ADD COLUMN sowing_date DATETIME",
            'harvest_date': "ALTER TABLE farmers ADD COLUMN harvest_date DATETIME",
            'crop_duration_days': "ALTER TABLE farmers ADD COLUMN crop_duration_days INTEGER",
            'yield_kg': "ALTER TABLE farmers ADD COLUMN yield_kg FLOAT",
            'cost': "ALTER TABLE farmers ADD COLUMN cost FLOAT",
            'revenue': "ALTER TABLE farmers ADD COLUMN revenue FLOAT",
            'profit': "ALTER TABLE farmers ADD COLUMN profit FLOAT",
            'livestock_count': "ALTER TABLE farmers ADD COLUMN livestock_count INTEGER",
            'storage_capacity_kg': "ALTER TABLE farmers ADD COLUMN storage_capacity_kg FLOAT",
            'workers_count': "ALTER TABLE farmers ADD COLUMN workers_count INTEGER",
        }

        for column_name, statement in column_statements.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


def _ensure_worker_columns() -> None:
    inspector = inspect(engine)
    if 'workers' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('workers')}
    with engine.begin() as connection:
        if 'user_id' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN user_id INTEGER"))
        if 'skills' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN skills VARCHAR(255)"))
        if 'location' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN location VARCHAR(160)"))
        if 'bio' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN bio TEXT"))
        if 'profile_image' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN profile_image VARCHAR(255)"))
        if 'availability_status' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN availability_status VARCHAR(40) DEFAULT 'looking_for_work'"))
        if 'assigned_job_id' not in existing_columns:
            connection.execute(text("ALTER TABLE workers ADD COLUMN assigned_job_id INTEGER"))

        connection.execute(text("UPDATE workers SET skills = COALESCE(NULLIF(skills, ''), experience)"))
        connection.execute(text("UPDATE workers SET location = COALESCE(NULLIF(location, ''), 'Unknown')"))
        connection.execute(text("UPDATE workers SET availability_status = COALESCE(NULLIF(availability_status, ''), 'looking_for_work')"))


def _ensure_user_columns() -> None:
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('users')}
    with engine.begin() as connection:
        if 'status' not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'"))
        if 'region' not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN region VARCHAR(120)"))
        if 'last_active' not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN last_active DATETIME"))

        connection.execute(text("UPDATE users SET status = COALESCE(NULLIF(status, ''), 'active')"))


def _ensure_activity_log_columns() -> None:
    inspector = inspect(engine)
    if 'activity_logs' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('activity_logs')}
    with engine.begin() as connection:
        if 'level' not in existing_columns:
            connection.execute(text("ALTER TABLE activity_logs ADD COLUMN level VARCHAR(20) DEFAULT 'info'"))
        if 'error_code' not in existing_columns:
            connection.execute(text("ALTER TABLE activity_logs ADD COLUMN error_code VARCHAR(120)"))
        if 'stack_trace' not in existing_columns:
            connection.execute(text("ALTER TABLE activity_logs ADD COLUMN stack_trace TEXT"))


def _ensure_equipment_booking_columns() -> None:
    inspector = inspect(engine)
    if 'equipment_bookings' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('equipment_bookings')}
    with engine.begin() as connection:
        if 'user_id' not in existing_columns:
            connection.execute(text("ALTER TABLE equipment_bookings ADD COLUMN user_id INTEGER"))
        connection.execute(
            text(
                """
                UPDATE equipment_bookings
                SET user_id = (
                    SELECT farmers.user_id
                    FROM farmers
                    WHERE farmers.id = equipment_bookings.farmer_id
                )
                WHERE user_id IS NULL
                """
            )
        )


def _ensure_alert_columns() -> None:
    inspector = inspect(engine)
    if 'alerts' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('alerts')}
    with engine.begin() as connection:
        if 'message' not in existing_columns:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN message TEXT"))
        if 'created_by' not in existing_columns:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN created_by INTEGER"))
        if 'approved_by' not in existing_columns:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN approved_by INTEGER"))
        if 'status' not in existing_columns:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN status VARCHAR(30) DEFAULT 'pending'"))
        if 'engagement_count' not in existing_columns:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN engagement_count INTEGER DEFAULT 0"))

        connection.execute(text("UPDATE alerts SET status = COALESCE(NULLIF(status, ''), 'approved')"))


def _normalize_approval_state() -> None:
    """Backfill legacy approval-based records into direct-availability states."""
    with engine.begin() as connection:
        connection.execute(text("UPDATE jobs SET status = 'open' WHERE status IN ('pending', 'approved')"))
        connection.execute(text("UPDATE equipment SET is_approved = 1 WHERE is_approved = 0"))
        connection.execute(
            text("UPDATE equipment_bookings SET status = 'confirmed' WHERE status IN ('pending', 'approved')")
        )
        connection.execute(text("UPDATE experts SET approval_status = 'approved', is_active = 1"))


@app.get('/')
def root() -> dict[str, str]:
    return {
        'message': 'SAMS backend is running',
        'health': '/health',
        'docs': '/docs',
    }


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


app.include_router(auth.router)
app.include_router(auth.register_router)
app.include_router(admin.router)
app.include_router(admin.router, prefix='/api')
app.include_router(farmer.router)
app.include_router(expert.router)
app.include_router(farmers.router)
app.include_router(crops.router)
app.include_router(crops_info.router)
app.include_router(advisory.router)
app.include_router(market.router)
app.include_router(employment.router)
app.include_router(ai.router)

# Serve static files for uploads
os.makedirs('uploads', exist_ok=True)
app.mount('/uploads', StaticFiles(directory='uploads'), name='uploads')
