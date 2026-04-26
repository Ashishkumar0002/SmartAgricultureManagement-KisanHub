from datetime import datetime, timedelta
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import AnalyticsEvent, Expert, Farmer, User
from app.schemas import AuthOut, ExpertRegistrationOut, FarmerRegistrationOut, LoginJSON, RegisterIn, UserOut
from app.services.deps import require_roles
from app.services.security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])
register_router = APIRouter(prefix='/register', tags=['register'])


def _save_upload(file: UploadFile | None, folder: str) -> str | None:
    if not file:
        return None
    os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(file.filename or '')[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    relative_path = os.path.join(folder, filename).replace('\\', '/')
    absolute_path = os.path.abspath(relative_path)
    with open(absolute_path, 'wb') as out:
        out.write(file.file.read())
    return relative_path


def _build_username(email: str) -> str:
    return email.lower().strip()


@router.post('/register', response_model=UserOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')

    user = User(
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        role=payload.role,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@register_router.post('/farmer', response_model=FarmerRegistrationOut)
async def register_farmer(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    state: str = Form(...),
    district: str = Form(...),
    village: str = Form(...),
    total_land_acres: float = Form(...),
    soil_type: str = Form(...),
    irrigation_type: str = Form(...),
    water_source: str = Form(...),
    crop_types: str = Form(...),
    current_crops: str = Form(...),
    farming_experience_years: int = Form(...),
    equipment_owned: str | None = Form(None),
    annual_income_range: str | None = Form(None),
    profile_photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')
    if db.query(User).filter(User.username == email.lower().strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Account already exists')

    profile_image_path = _save_upload(profile_photo, 'uploads/profiles/farmers')
    username = _build_username(email)

    user = User(
        full_name=full_name,
        email=email,
        username=username,
        role='farmer',
        phone=phone,
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.flush()

    location = f'{village}, {district}, {state}'
    farmer = Farmer(
        user_id=user.id,
        name=full_name,
        location=location,
        total_land=total_land_acres,
        soil_type=soil_type,
        irrigation_type=irrigation_type,
        water_source=water_source,
        crop_types=crop_types,
        crop_variety=crop_types,
        current_crops=current_crops,
        farming_experience_years=farming_experience_years,
        equipment_owned=equipment_owned,
        annual_income_range=annual_income_range,
        state=state,
        district=district,
        village=village,
        phone=phone,
        profile_image=profile_image_path,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    return FarmerRegistrationOut(
        message='Farmer registration successful',
        user_id=user.id,
        farmer_id=farmer.id,
        role='farmer',
    )


@register_router.post('/expert', response_model=ExpertRegistrationOut)
async def register_expert(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    qualification: str = Form(...),
    specialization: str = Form(...),
    years_of_experience: int = Form(...),
    working_organization: str | None = Form(None),
    service_areas: str = Form(...),
    languages_known: str = Form(...),
    bio: str | None = Form(None),
    profile_photo: UploadFile | None = File(None),
    certifications_file: UploadFile | None = File(None),
    id_proof_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')
    if db.query(User).filter(User.username == email.lower().strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Account already exists')

    profile_image_path = _save_upload(profile_photo, 'uploads/profiles/experts')
    certification_path = _save_upload(certifications_file, 'uploads/docs/certifications')
    id_proof_path = _save_upload(id_proof_file, 'uploads/docs/id-proofs')
    username = _build_username(email)

    user = User(
        full_name=full_name,
        email=email,
        username=username,
        role='expert',
        phone=phone,
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.flush()

    expert = Expert(
        user_id=user.id,
        specialization=specialization,
        qualification=qualification,
        phone=phone,
        bio=bio,
        profile_image=profile_image_path,
        years_of_experience=years_of_experience,
        certifications_file=certification_path,
        id_proof_file=id_proof_path,
        working_organization=working_organization,
        service_areas=service_areas,
        languages_known=languages_known,
        approval_status='approved',
        is_active=True,
    )
    db.add(expert)
    db.commit()
    db.refresh(expert)

    return ExpertRegistrationOut(
        message='Expert registration completed successfully.',
        user_id=user.id,
        expert_id=expert.id,
        role='expert',
        approval_status=expert.approval_status,
    )


@router.get('/users', response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_roles('admin'))):
    return db.query(User).order_by(User.id.desc()).all()


def _issue_token_for_user(user: User) -> AuthOut:
    access_token = create_access_token(
        data={'sub': user.username, 'role': user.role},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return AuthOut(access_token=access_token, token_type='bearer', role=user.role, username=user.username)


@router.post('/login', response_model=AuthOut)
async def login(request: Request, db: Session = Depends(get_db)) -> AuthOut:
    identifier: str | None = None
    password: str | None = None

    content_type = request.headers.get('content-type', '').lower()
    if 'application/json' in content_type:
        payload_data = await request.json()
        payload = LoginJSON(
            email=str(payload_data.get('email') or '') or None,
            username=str(payload_data.get('username') or '') or None,
            phone=str(payload_data.get('phone') or '') or None,
            password=str(payload_data.get('password') or ''),
        )
        identifier = payload.email or payload.username or payload.phone
        password = payload.password
    else:
        form = await request.form()
        identifier = str(form.get('username') or form.get('email') or form.get('phone') or '')
        password = str(form.get('password') or '')

    identifier = (identifier or '').strip()
    password = password or ''

    if not identifier or not password:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Missing credentials')

    normalized_identifier = identifier.lower()
    try:
        user = (
            db.query(User)
            .filter(
                or_(
                    func.lower(User.username) == normalized_identifier,
                    func.lower(User.email) == normalized_identifier,
                    User.phone == identifier,
                )
            )
            .first()
        )
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Database unavailable or schema mismatch. Restart backend with correct DATABASE_URL and reseed if needed.',
        )
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    if (user.status or 'active').lower() == 'suspended':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User account is suspended')

    user.last_active = datetime.utcnow()

    if user.role == 'expert':
        try:
            expert = db.query(Expert).filter(Expert.user_id == user.id).first()
        except OperationalError:
            expert = None
        if expert and not expert.is_active:
            expert.is_active = True

    try:
        db.add(AnalyticsEvent(user_id=user.id, event_type='login', feature='auth'))
    except Exception:
        # Non-blocking analytics persistence should not prevent authentication.
        pass

    db.commit()

    return _issue_token_for_user(user)
