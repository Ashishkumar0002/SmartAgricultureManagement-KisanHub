from datetime import datetime, timedelta
import json
import os
import shutil
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import (
    Advisory,
    AdvisoryMessage,
    Alert,
    Expert,
    ExpertAssignment,
    Farmer,
    FarmingTechnique,
    User,
)
from app.schemas import (
    AdvisoryDetailOut,
    AdvisoryMessageIn,
    AdvisoryMessageOut,
    AlertIn,
    AlertOut,
    ExpertDashboardStatsOut,
    ExpertIn,
    ExpertOut,
    ExpertProfileOut,
    ExpertQueryOut,
    ExpertQueryWithFarmerOut,
    FarmingTechniqueIn,
    FarmingTechniqueOut,
)
from app.services.deps import get_current_user

router = APIRouter(prefix="/expert", tags=["expert"])


def _parse_expert_bio_fields(raw_bio: str | None) -> tuple[str | None, str | None, str | None]:
    if not raw_bio:
        return None, None, None

    try:
        parsed = json.loads(raw_bio)
    except json.JSONDecodeError:
        return raw_bio, None, None

    if not isinstance(parsed, dict):
        return raw_bio, None, None

    bio = parsed.get('bio') if isinstance(parsed.get('bio'), str) else None
    achievements = parsed.get('achievements') if isinstance(parsed.get('achievements'), str) else None
    research_work = parsed.get('research_work') if isinstance(parsed.get('research_work'), str) else None
    return bio, achievements, research_work


def _serialize_expert_bio_fields(
    bio: str | None,
    achievements: str | None,
    research_work: str | None
) -> str | None:
    payload = {
        'bio': (bio or '').strip() or None,
        'achievements': (achievements or '').strip() or None,
        'research_work': (research_work or '').strip() or None,
    }

    if not any(payload.values()):
        return None

    return json.dumps(payload)


def require_expert(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an expert"""
    if current_user.role != "expert":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only experts can access this resource"
        )
    return current_user


def log_activity(db: Session, user_id: int, action: str, entity_type: str, 
                 entity_id: Optional[int] = None, description: str = "", ip_address: Optional[str] = None) -> None:
    """Log user activity for audit trail"""
    from app.models import ActivityLog
    log_entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()


# ============================================
# EXPERT PROFILE ENDPOINTS
# ============================================

@router.get("/profile", response_model=ExpertProfileOut)
async def get_expert_profile(current_user: User = Depends(require_expert), db: Session = Depends(get_db)):
    """Get current expert's profile"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    bio, achievements, research_work = _parse_expert_bio_fields(expert.bio)

    return ExpertProfileOut(
        id=expert.id,
        user_id=expert.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        specialization=expert.specialization,
        bio=bio,
        profile_image=expert.profile_image,
        phone=expert.phone,
        years_of_experience=expert.years_of_experience,
        achievements=achievements,
        research_work=research_work,
        rating=expert.rating,
        total_queries_resolved=expert.total_queries_resolved,
        is_active=expert.is_active,
        created_at=expert.created_at,
        updated_at=expert.updated_at
    )


@router.put("/profile", response_model=ExpertOut)
async def update_expert_profile(
    profile_data: ExpertIn,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Update expert profile"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    expert.specialization = profile_data.specialization
    expert.bio = _serialize_expert_bio_fields(
        profile_data.bio,
        profile_data.achievements,
        profile_data.research_work,
    )
    expert.years_of_experience = profile_data.years_of_experience
    expert.updated_at = datetime.utcnow()
    
    db.add(expert)
    db.commit()
    db.refresh(expert)
    
    log_activity(db, current_user.id, "update", "expert_profile", expert.id, 
                f"Updated expert profile: {expert.specialization}")
    
    bio, achievements, research_work = _parse_expert_bio_fields(expert.bio)
    return ExpertOut(
        id=expert.id,
        user_id=expert.user_id,
        specialization=expert.specialization,
        bio=bio,
        achievements=achievements,
        research_work=research_work,
        phone=expert.phone,
        years_of_experience=expert.years_of_experience,
        profile_image=expert.profile_image,
        rating=expert.rating,
        total_queries_resolved=expert.total_queries_resolved,
        is_active=expert.is_active,
        created_at=expert.created_at,
        updated_at=expert.updated_at,
    )


@router.post("/profile/photo")
async def upload_expert_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Upload and update expert profile photo"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()

    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp"}
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    upload_dir = os.path.join("uploads", "profiles", "experts")
    os.makedirs(upload_dir, exist_ok=True)

    file_name = f"expert_{expert.id}_{uuid4().hex}{extension}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as output:
        shutil.copyfileobj(file.file, output)

    expert.profile_image = f"/uploads/profiles/experts/{file_name}"
    expert.updated_at = datetime.utcnow()
    db.add(expert)
    db.commit()

    return {"profile_image": expert.profile_image}


# ============================================
# QUERY MANAGEMENT ENDPOINTS
# ============================================

@router.get("/queries", response_model=list[ExpertQueryWithFarmerOut])
async def get_assigned_queries(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get all queries assigned to expert"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    expert_id = expert.id if expert else None
    
    # Show both expert-owned queries and unassigned pending queries so
    # newly submitted farmer questions are visible immediately.
    owned_or_pending = [and_(Advisory.expert_id.is_(None), Advisory.status == 'pending')]
    if expert_id is not None:
        owned_or_pending.insert(0, Advisory.expert_id == expert_id)

    query = select(Advisory).where(or_(*owned_or_pending))
    
    if status_filter:
        query = query.where(Advisory.status == status_filter)
    
    advisories = db.execute(
        query.order_by(Advisory.created_at.desc()).offset(offset).limit(limit)
    ).scalars().all()
    
    result = []
    for advisory in advisories:
        farmer = db.execute(
            select(Farmer).where(Farmer.id == advisory.farmer_id)
        ).scalar_one_or_none()
        
        result.append(ExpertQueryWithFarmerOut(
            id=advisory.id,
            question=advisory.question,
            response=advisory.response,
            farmer_id=advisory.farmer_id,
            farmer_name=farmer.name if farmer else None,
            farmer_location=farmer.location if farmer else None,
            farmer_soil_type=farmer.soil_type if farmer else None,
            farmer_crop_variety=farmer.crop_variety if farmer else None,
            farmer_profile_image=farmer.profile_image if farmer else None,
            expert_id=advisory.expert_id,
            status=advisory.status,
            created_at=advisory.created_at
        ))
    
    return result


@router.get("/queries/{query_id}", response_model=ExpertQueryOut)
async def get_query_detail(
    query_id: int,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get detailed view of a query with messages and images"""
    advisory = db.execute(
        select(Advisory).where(Advisory.id == query_id)
    ).scalar_one_or_none()
    
    if not advisory:
        raise HTTPException(status_code=404, detail="Query not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()

    can_view = (expert is not None and advisory.expert_id == expert.id) or (
        advisory.expert_id is None and advisory.status == 'pending'
    )
    if not can_view:
        raise HTTPException(status_code=403, detail="Not authorized to view this query")
    
    farmer = db.execute(
        select(Farmer).where(Farmer.id == advisory.farmer_id)
    ).scalar_one_or_none()
    
    from app.schemas import AdvisoryImageOut
    images = [
        AdvisoryImageOut(
            id=img.id,
            advisory_id=img.advisory_id,
            image_path=img.image_path,
            uploaded_at=img.uploaded_at
        ) for img in advisory.images
    ]
    
    messages = [
        AdvisoryMessageOut(
            id=msg.id,
            advisory_id=msg.advisory_id,
            message=msg.message,
            sender_id=msg.sender_id,
            is_from_expert=msg.is_from_expert,
            created_at=msg.created_at
        ) for msg in advisory.messages
    ]
    
    return ExpertQueryOut(
        id=advisory.id,
        question=advisory.question,
        response=advisory.response,
        farmer_id=advisory.farmer_id,
        farmer_name=farmer.name if farmer else None,
        farmer_location=farmer.location if farmer else None,
        farmer_soil_type=farmer.soil_type if farmer else None,
        farmer_crop_variety=farmer.crop_variety if farmer else None,
        expert_id=advisory.expert_id,
        status=advisory.status,
        created_at=advisory.created_at,
        images=images,
        messages=messages
    )


@router.put("/queries/{query_id}/status", response_model=ExpertQueryWithFarmerOut)
async def update_query_status(
    query_id: int,
    new_status: str,
    response: Optional[str] = None,
    payload: Optional[dict] = Body(default=None),
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Update query status and optionally provide response"""
    advisory = db.execute(
        select(Advisory).where(Advisory.id == query_id)
    ).scalar_one_or_none()
    
    if not advisory:
        raise HTTPException(status_code=404, detail="Query not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()

    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    # Allow expert to claim unassigned pending advisories while updating status.
    if advisory.expert_id is None and advisory.status == 'pending':
        advisory.expert_id = expert.id
    elif advisory.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this query")
    
    if new_status not in ['pending', 'assigned', 'answered']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    response_text = response
    if response_text is None and payload:
        response_text = payload.get('response')

    previous_status = advisory.status
    advisory.status = new_status
    if response_text:
        advisory.response = response_text
    
    if new_status == 'answered' and previous_status != 'answered':
        expert.total_queries_resolved += 1
    
    db.add(advisory)
    db.add(expert)
    db.commit()
    db.refresh(advisory)
    
    farmer = db.execute(
        select(Farmer).where(Farmer.id == advisory.farmer_id)
    ).scalar_one_or_none()
    
    log_activity(db, current_user.id, "update", "advisory", query_id,
                f"Updated query status to {new_status}")
    
    return ExpertQueryWithFarmerOut(
        id=advisory.id,
        question=advisory.question,
        response=advisory.response,
        farmer_id=advisory.farmer_id,
        farmer_name=farmer.name if farmer else None,
        farmer_location=farmer.location if farmer else None,
        farmer_soil_type=farmer.soil_type if farmer else None,
        farmer_crop_variety=farmer.crop_variety if farmer else None,
        farmer_profile_image=farmer.profile_image if farmer else None,
        expert_id=advisory.expert_id,
        status=advisory.status,
        created_at=advisory.created_at
    )


@router.post("/queries/{query_id}/message", response_model=AdvisoryMessageOut)
async def send_message_to_query(
    query_id: int,
    message_data: AdvisoryMessageIn,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Send a message to a farmer query"""
    advisory = db.execute(
        select(Advisory).where(Advisory.id == query_id)
    ).scalar_one_or_none()
    
    if not advisory:
        raise HTTPException(status_code=404, detail="Query not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()

    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    # First expert response claims unassigned pending advisory.
    if advisory.expert_id is None and advisory.status == 'pending':
        advisory.expert_id = expert.id
    elif advisory.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to message on this query")
    
    new_message = AdvisoryMessage(
        advisory_id=query_id,
        sender_id=current_user.id,
        message=message_data.message,
        is_from_expert=True,
        created_at=datetime.utcnow()
    )

    # Keep advisory.response in sync so farmer advisory response views
    # always show the latest expert-provided response text.
    advisory.response = message_data.message
    if advisory.status != 'answered':
        advisory.status = 'answered'
    
    db.add(new_message)
    db.add(advisory)
    db.commit()
    db.refresh(new_message)
    
    return AdvisoryMessageOut(
        id=new_message.id,
        advisory_id=new_message.advisory_id,
        message=new_message.message,
        sender_id=new_message.sender_id,
        is_from_expert=new_message.is_from_expert,
        created_at=new_message.created_at
    )


@router.get("/queries/{query_id}/messages", response_model=list[AdvisoryMessageOut])
async def get_query_messages(
    query_id: int,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get message history for a query"""
    advisory = db.execute(
        select(Advisory).where(Advisory.id == query_id)
    ).scalar_one_or_none()
    
    if not advisory:
        raise HTTPException(status_code=404, detail="Query not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if advisory.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")
    
    messages = db.execute(
        select(AdvisoryMessage).where(AdvisoryMessage.advisory_id == query_id)
        .order_by(AdvisoryMessage.created_at)
    ).scalars().all()
    
    return [
        AdvisoryMessageOut(
            id=msg.id,
            advisory_id=msg.advisory_id,
            message=msg.message,
            sender_id=msg.sender_id,
            is_from_expert=msg.is_from_expert,
            created_at=msg.created_at
        ) for msg in messages
    ]


# ============================================
# ALERT MANAGEMENT ENDPOINTS
# ============================================

@router.get("/alerts", response_model=list[AlertOut])
async def get_expert_alerts(
    active_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get all alerts created by expert"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    query = select(Alert).where(Alert.expert_id == expert.id)
    
    if active_only:
        query = query.where(Alert.is_active == True)
    
    alerts = db.execute(query.offset(offset).limit(limit)).scalars().all()
    
    return [AlertOut.from_orm(alert) for alert in alerts]


@router.post("/alerts", response_model=AlertOut)
async def create_alert(
    alert_data: AlertIn,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Create a new alert"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    new_alert = Alert(
        expert_id=expert.id,
        title=alert_data.title,
        description=alert_data.description,
        alert_type=alert_data.alert_type,
        severity=alert_data.severity,
        target_regions=alert_data.target_regions,
        affected_crops=alert_data.affected_crops,
        recommendations=alert_data.recommendations,
        expiry_date=alert_data.expiry_date,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    log_activity(db, current_user.id, "create", "alert", new_alert.id,
                f"Created alert: {alert_data.title}")
    
    return AlertOut.from_orm(new_alert)


@router.put("/alerts/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: int,
    alert_data: AlertIn,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Update an alert"""
    alert = db.execute(
        select(Alert).where(Alert.id == alert_id)
    ).scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if alert.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this alert")
    
    alert.title = alert_data.title
    alert.description = alert_data.description
    alert.alert_type = alert_data.alert_type
    alert.severity = alert_data.severity
    alert.target_regions = alert_data.target_regions
    alert.affected_crops = alert_data.affected_crops
    alert.recommendations = alert_data.recommendations
    alert.expiry_date = alert_data.expiry_date
    alert.updated_at = datetime.utcnow()
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    log_activity(db, current_user.id, "update", "alert", alert_id,
                f"Updated alert: {alert_data.title}")
    
    return AlertOut.from_orm(alert)


@router.delete("/alerts/{alert_id}")
async def deactivate_alert(
    alert_id: int,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Deactivate an alert"""
    alert = db.execute(
        select(Alert).where(Alert.id == alert_id)
    ).scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if alert.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
    
    alert.is_active = False
    db.add(alert)
    db.commit()
    
    log_activity(db, current_user.id, "delete", "alert", alert_id, "Deactivated alert")
    
    return {"message": "Alert deactivated successfully"}


# ============================================
# FARMING TECHNIQUES - KNOWLEDGE SHARING
# ============================================

@router.get("/techniques", response_model=list[FarmingTechniqueOut])
async def get_expert_techniques(
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get all techniques created by expert"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    query = select(FarmingTechnique).where(FarmingTechnique.expert_id == expert.id)
    
    if category:
        normalized_category = category.strip().lower()
        query = query.where(func.lower(FarmingTechnique.category) == normalized_category)
    
    techniques = db.execute(query.offset(offset).limit(limit)).scalars().all()
    
    return [FarmingTechniqueOut.from_orm(tech) for tech in techniques]


@router.post("/techniques", response_model=FarmingTechniqueOut)
async def create_technique(
    technique_data: FarmingTechniqueIn,
    is_featured: bool = False,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Create a new farming technique"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    new_technique = FarmingTechnique(
        title=technique_data.title,
        description=technique_data.description,
        category=technique_data.category,
        crop_type=technique_data.crop_type,
        expert_id=expert.id,
        is_featured=is_featured,
        created_at=datetime.utcnow()
    )
    
    db.add(new_technique)
    db.commit()
    db.refresh(new_technique)
    
    log_activity(db, current_user.id, "create", "technique", new_technique.id,
                f"Created technique: {technique_data.title}")
    
    return FarmingTechniqueOut.from_orm(new_technique)


@router.put("/techniques/{technique_id}", response_model=FarmingTechniqueOut)
async def update_technique(
    technique_id: int,
    technique_data: FarmingTechniqueIn,
    is_featured: Optional[bool] = None,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Update a farming technique"""
    technique = db.execute(
        select(FarmingTechnique).where(FarmingTechnique.id == technique_id)
    ).scalar_one_or_none()
    
    if not technique:
        raise HTTPException(status_code=404, detail="Technique not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if technique.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this technique")
    
    technique.title = technique_data.title
    technique.description = technique_data.description
    technique.category = technique_data.category
    technique.crop_type = technique_data.crop_type
    if is_featured is not None:
        technique.is_featured = is_featured
    technique.updated_at = datetime.utcnow()
    
    db.add(technique)
    db.commit()
    db.refresh(technique)
    
    log_activity(db, current_user.id, "update", "technique", technique_id,
                f"Updated technique: {technique_data.title}")
    
    return FarmingTechniqueOut.from_orm(technique)


@router.delete("/techniques/{technique_id}")
async def delete_technique(
    technique_id: int,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Delete a farming technique"""
    technique = db.execute(
        select(FarmingTechnique).where(FarmingTechnique.id == technique_id)
    ).scalar_one_or_none()
    
    if not technique:
        raise HTTPException(status_code=404, detail="Technique not found")
    
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if technique.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this technique")
    
    db.delete(technique)
    db.commit()
    
    log_activity(db, current_user.id, "delete", "technique", technique_id,
                "Deleted technique")
    
    return {"message": "Technique deleted successfully"}


# ============================================
# DASHBOARD STATISTICS
# ============================================

@router.get("/dashboard-stats", response_model=ExpertDashboardStatsOut)
async def get_expert_dashboard_stats(
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    """Get expert dashboard statistics"""
    expert = db.execute(
        select(Expert).where(Expert.user_id == current_user.id)
    ).scalar_one_or_none()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    # Total assigned queries
    total_assigned = db.execute(
        select(func.count(Advisory.id)).where(Advisory.expert_id == expert.id)
    ).scalar() or 0
    
    # Pending queries
    pending = db.execute(
        select(func.count(Advisory.id)).where(
            and_(Advisory.expert_id == expert.id, Advisory.status == 'assigned')
        )
    ).scalar() or 0
    
    # Resolved queries
    resolved = db.execute(
        select(func.count(Advisory.id)).where(
            and_(Advisory.expert_id == expert.id, Advisory.status == 'answered')
        )
    ).scalar() or 0
    
    # Alerts sent
    alerts_sent = db.execute(
        select(func.count(Alert.id)).where(Alert.expert_id == expert.id)
    ).scalar() or 0
    
    # Active alerts
    active_alerts = db.execute(
        select(func.count(Alert.id)).where(
            and_(Alert.expert_id == expert.id, Alert.is_active == True)
        )
    ).scalar() or 0
    
    # Average response time (simplified - 2 hours for mock)
    avg_response_time = 2.0
    
    return ExpertDashboardStatsOut(
        total_assigned_queries=total_assigned,
        pending_queries=pending,
        resolved_queries=resolved,
        alerts_sent=alerts_sent,
        active_alerts=active_alerts,
        avg_response_time_hours=avg_response_time,
        farmer_satisfaction_rating=expert.rating
    )
