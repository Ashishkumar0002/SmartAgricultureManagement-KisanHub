from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    ActivityLog,
    Advisory,
    Application,
    Alert,
    AnalyticsEvent,
    Content,
    Equipment,
    EquipmentBooking,
    Expert,
    ExpertAssignment,
    FarmImage,
    Farmer,
    Job,
    User,
    UserRating,
    Worker,
)
from app.schemas import (
    ActivityLogOut,
    AdminApplicationOut,
    AdminJobOut,
    ApplicationStatusUpdateIn,
    AdminStatsOut,
    ContentIn,
    ContentOut,
    EquipmentIn,
    EquipmentOut,
    ExpertAssignmentIn,
    ExpertAssignmentOut,
    SystemAnalyticsOut,
    UserOut,
    UserRatingOut,
    WorkerOut,
)
from app.services.admin_service import admin_service
from app.services.deps import require_roles

router = APIRouter(prefix='/admin', tags=['admin'])


class UserStatusUpdateIn(BaseModel):
    status: str


class AlertCreateIn(BaseModel):
    expert_id: int
    title: str
    description: str
    message: str | None = None
    alert_type: str
    severity: str = 'medium'
    target_regions: str
    affected_crops: str | None = None
    recommendations: str | None = None
    expiry_date: datetime | None = None


def _serialize_content(content: Content) -> dict:
    return {
        'id': content.id,
        'title': content.title,
        'description': content.description,
        'category': content.category,
        'location': content.location,
        'metadata': content.content_metadata,
        'created_by': content.created_by,
        'created_at': content.created_at,
        'updated_at': content.updated_at,
    }


def _serialize_admin_job(job: Job) -> dict:
    farmer_name = job.farmer.name if job.farmer else 'Unknown Farmer'
    return {
        'id': job.id,
        'farmer_id': job.farmer_id,
        'farmer_name': farmer_name,
        'title': job.title,
        'description': job.description,
        'location': job.location,
        'wage': job.wage,
        'duration': job.duration,
        'status': job.status,
        'created_at': job.created_at,
    }


def _serialize_admin_application(item: Application) -> dict:
    applicant_name = item.applicant.full_name if item.applicant else 'Unknown Applicant'
    applicant_email = item.applicant.email if item.applicant else ''
    farmer_name = item.job.farmer.name if item.job and item.job.farmer else 'Unknown Farmer'

    return {
        'id': item.id,
        'job_id': item.job_id,
        'job_title': item.job.title if item.job else 'Unknown Job',
        'applicant_id': item.applicant_id,
        'applicant_name': applicant_name,
        'applicant_email': applicant_email,
        'farmer_name': farmer_name,
        'message': item.message,
        'status': item.status,
        'created_at': item.created_at,
    }


# ====================
# USER MANAGEMENT
# ====================
@router.get('/users', response_model=list[UserOut])
def get_all_users(
    role: str | None = None,
    region: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all users (farmers, experts, and admins) with optional filters."""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if region:
        query = query.filter(User.region == region)
    if status_filter:
        query = query.filter(User.status == status_filter)

    return query.order_by(User.id.desc()).all()


@router.patch('/users/{user_id}/status')
def update_user_status(
    user_id: int,
    payload: UserStatusUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    valid_statuses = {'active', 'suspended'}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid status. Must be one of {sorted(valid_statuses)}',
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    user.status = payload.status
    db.commit()
    db.refresh(user)

    log_activity(
        db=db,
        user_id=current_user.id,
        action='update',
        entity_type='user',
        entity_id=user.id,
        description=f'Updated user {user.username} status to {payload.status}',
    )

    return {'id': user.id, 'status': user.status}


@router.get('/users/{user_id}/activity')
def get_user_activity(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    items = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(max(1, min(limit, 200)))
        .all()
    )
    return items


@router.get('/dashboard-stats')
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    return admin_service.get_dashboard_stats(db)


@router.get('/farming-insights')
def get_farming_insights(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    return admin_service.get_farming_insights(db)


@router.get('/analytics')
def get_advanced_analytics(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    return admin_service.get_analytics(db)


@router.post('/alerts')
def create_alert(
    payload: AlertCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    alert = Alert(
        expert_id=payload.expert_id,
        title=payload.title,
        message=payload.message,
        description=payload.description,
        created_by=current_user.id,
        status='approved',
        alert_type=payload.alert_type,
        severity=payload.severity,
        target_regions=payload.target_regions,
        affected_crops=payload.affected_crops,
        recommendations=payload.recommendations,
        expiry_date=payload.expiry_date,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch('/alerts/{alert_id}/approve')
def approve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Alert not found')

    alert.status = 'approved'
    alert.approved_by = current_user.id
    db.commit()
    db.refresh(alert)
    return alert


@router.get('/alerts')
def get_alerts(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.created_at.desc()).all()


@router.get('/equipment/analytics')
def get_equipment_analytics(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    return admin_service.get_equipment_analytics(db)


@router.get('/farm-images')
def get_farm_images(
    user_id: int | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    query = db.query(FarmImage)
    if user_id is not None:
        query = query.filter(FarmImage.user_id == user_id)
    return query.order_by(FarmImage.uploaded_at.desc()).limit(max(1, min(limit, 500))).all()


@router.get('/logs')
def get_logs(
    level: str | None = None,
    days: int = 7,
    limit: int = 200,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    start_date = datetime.utcnow() - timedelta(days=max(1, min(days, 90)))
    query = db.query(ActivityLog).filter(ActivityLog.timestamp >= start_date)
    if level:
        query = query.filter(ActivityLog.level == level)
    return query.order_by(ActivityLog.timestamp.desc()).limit(max(1, min(limit, 1000))).all()


@router.get('/system-health')
def get_system_health(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    return admin_service.get_system_health(db)


@router.get('/users/role/{role}', response_model=list[UserOut])
def get_users_by_role(
    role: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get users filtered by role"""
    valid_roles = ['farmer', 'expert', 'admin']
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid role. Must be one of {valid_roles}',
        )
    return db.query(User).filter(User.role == role).order_by(User.id.desc()).all()


@router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Delete a user (cannot delete yourself)"""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Cannot delete your own account',
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        )

    db.delete(user)
    db.commit()
    
    # Log the activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='delete',
        entity_type='user',
        entity_id=user_id,
        description=f'Deleted user: {user.username}',
    )
    db.add(activity)
    db.commit()
    
    return None


# ====================
# EXPERT ASSIGNMENT
# ====================
@router.get('/expert-assignments', response_model=list[ExpertAssignmentOut])
def get_expert_assignments(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all expert assignments with optional status filter"""
    query = db.query(ExpertAssignment)
    if status_filter:
        query = query.filter(ExpertAssignment.status == status_filter)
    return query.order_by(ExpertAssignment.id.desc()).all()


@router.post('/expert-assignments', response_model=ExpertAssignmentOut)
def create_expert_assignment(
    payload: ExpertAssignmentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Assign an expert to a farmer's advisory request"""
    # Check if advisory exists
    advisory = db.query(Advisory).filter(Advisory.id == payload.advisory_id).first()
    if not advisory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Advisory not found',
        )

    # Accept either expert profile id or expert user id and normalize to profile id.
    expert_profile = (
        db.query(Expert)
        .filter(or_(Expert.id == payload.expert_id, Expert.user_id == payload.expert_id))
        .first()
    )
    if not expert_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Expert not found',
        )

    assignment = ExpertAssignment(
        advisory_id=payload.advisory_id,
        expert_id=expert_profile.id,
        assigned_by=current_user.id,
        status='assigned',
    )
    db.add(assignment)

    # Update advisory with expert
    advisory.expert_id = expert_profile.id
    db.commit()
    db.refresh(assignment)

    # Log activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='create',
        entity_type='expert_assignment',
        entity_id=assignment.id,
        description=f'Assigned expert {expert_profile.id} to advisory {payload.advisory_id}',
    )
    db.add(activity)
    db.commit()

    return assignment


@router.patch('/expert-assignments/{assignment_id}', response_model=ExpertAssignmentOut)
def update_expert_assignment(
    assignment_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Update expert assignment status"""
    valid_statuses = ['pending', 'assigned', 'completed']
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid status. Must be one of {valid_statuses}',
        )

    assignment = db.query(ExpertAssignment).filter(ExpertAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Assignment not found',
        )

    assignment.status = new_status
    if new_status == 'completed':
        assignment.completion_date = datetime.utcnow()

    db.commit()
    db.refresh(assignment)

    # Log activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='update',
        entity_type='expert_assignment',
        entity_id=assignment_id,
        description=f'Updated assignment status to {new_status}',
    )
    db.add(activity)
    db.commit()

    return assignment


# ====================
# CONTENT MANAGEMENT
# ====================
@router.get('/contents', response_model=list[ContentOut])
def get_contents(
    category: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all content with optional category filter"""
    query = db.query(Content)
    if category:
        query = query.filter(Content.category == category)
    contents = query.order_by(Content.id.desc()).all()
    return [_serialize_content(content) for content in contents]


@router.post('/contents', response_model=ContentOut)
def create_content(
    payload: ContentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Create new content (weather, techniques, disease prevention, market info)"""
    content = Content(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        content_metadata=payload.metadata,
        created_by=current_user.id,
    )
    db.add(content)
    db.commit()
    db.refresh(content)

    # Log activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='create',
        entity_type='content',
        entity_id=content.id,
        description=f'Created content: {payload.title}',
    )
    db.add(activity)
    db.commit()

    return _serialize_content(content)


@router.put('/contents/{content_id}', response_model=ContentOut)
def update_content(
    content_id: int,
    payload: ContentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Update existing content"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Content not found',
        )

    content.title = payload.title
    content.description = payload.description
    content.category = payload.category
    content.location = payload.location
    content.content_metadata = payload.metadata
    content.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(content)

    # Log activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='update',
        entity_type='content',
        entity_id=content_id,
        description=f'Updated content: {payload.title}',
    )
    db.add(activity)
    db.commit()

    return _serialize_content(content)


@router.delete('/contents/{content_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Delete content"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Content not found',
        )

    db.delete(content)

    # Log activity
    activity = ActivityLog(
        user_id=current_user.id,
        action='delete',
        entity_type='content',
        entity_id=content_id,
        description=f'Deleted content: {content.title}',
    )
    db.add(activity)
    db.commit()

    return None


# ====================
# EQUIPMENT MANAGEMENT
# ====================
@router.get('/equipment', response_model=list[EquipmentOut])
def get_equipment(
    is_available: bool | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all equipment with optional filters"""
    query = db.query(Equipment)
    if is_available is not None:
        query = query.filter(Equipment.is_available == is_available)
    return query.order_by(Equipment.id.desc()).all()


@router.post('/equipment', response_model=EquipmentOut)
def create_equipment(
    payload: EquipmentIn,
    owner_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Create equipment listing (as admin)"""
    equipment = Equipment(
        name=payload.name,
        description=payload.description,
        daily_rent=payload.daily_rent,
        location=payload.location,
        owner_id=owner_id,
        condition=payload.condition,
        is_approved=True,
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


# ====================
# EMPLOYMENT / LABOR MANAGEMENT
# ====================
@router.get('/jobs', response_model=list[AdminJobOut])
def get_admin_jobs(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all job posts for labor management."""
    query = db.query(Job).join(Farmer, Farmer.id == Job.farmer_id)

    if status_filter:
        query = query.filter(Job.status == status_filter)

    jobs = query.order_by(Job.id.desc()).all()
    return [_serialize_admin_job(job) for job in jobs]


@router.get('/applications', response_model=list[AdminApplicationOut])
def get_admin_applications(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all worker job applications."""
    query = (
        db.query(Application)
        .join(Job, Job.id == Application.job_id)
    )

    if status_filter:
        query = query.filter(Application.status == status_filter)

    applications = query.order_by(Application.id.desc()).all()
    return [_serialize_admin_application(item) for item in applications]


@router.put('/applications/{application_id}/status', response_model=AdminApplicationOut)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Accept or reject a job application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Application not found')

    application.status = payload.status
    db.commit()
    db.refresh(application)

    log_activity(
        db=db,
        user_id=current_user.id,
        action='update',
        entity_type='application',
        entity_id=application.id,
        description=f'Updated application #{application.id} status to {payload.status}',
    )

    return _serialize_admin_application(application)


@router.get('/workers', response_model=list[WorkerOut])
def get_admin_workers(
    blocked: bool | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get all workers with optional blocked filter."""
    query = db.query(Worker)
    if blocked is not None:
        query = query.filter(Worker.is_blocked == blocked)
    return query.order_by(Worker.id.desc()).all()


@router.delete('/workers/{worker_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_or_block_worker(
    worker_id: int,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
):
    """Remove or block a worker account used for labor applications."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Worker not found')

    if hard_delete:
        db.delete(worker)
        description = f'Removed worker profile: {worker.name}'
        action = 'delete'
    else:
        worker.is_blocked = True
        description = f'Blocked worker profile: {worker.name}'
        action = 'update'

    db.commit()

    log_activity(
        db=db,
        user_id=current_user.id,
        action=action,
        entity_type='worker',
        entity_id=worker_id,
        description=description,
    )

    return None


# ====================
# ACTIVITY MONITORING
# ====================
@router.get('/activities', response_model=list[ActivityLogOut])
def get_activities(
    user_id: int | None = None,
    action: str | None = None,
    days: int = 7,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get activity logs with optional filters"""
    start_date = datetime.utcnow() - timedelta(days=days)
    query = db.query(ActivityLog).filter(ActivityLog.timestamp >= start_date)

    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action:
        query = query.filter(ActivityLog.action == action)

    return query.order_by(ActivityLog.timestamp.desc()).all()


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    description: str,
    entity_id: int | None = None,
    ip_address: str | None = None,
):
    """Helper function to log activities"""
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address,
    )
    db.add(activity)
    db.commit()


# ====================
# ANALYTICS
# ====================
@router.get('/analytics/system', response_model=SystemAnalyticsOut)
def get_system_analytics(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get overall system analytics"""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_farmers = db.query(func.count(User.id)).filter(User.role == 'farmer').scalar() or 0
    total_experts = db.query(func.count(User.id)).filter(User.role == 'expert').scalar() or 0
    total_advisories = db.query(func.count(Advisory.id)).scalar() or 0
    pending_advisories = db.query(func.count(Advisory.id)).filter(Advisory.expert_id.is_(None)).scalar() or 0

    # Calculate average expert response time
    completed = db.query(ExpertAssignment).filter(
        ExpertAssignment.status == 'completed',
        ExpertAssignment.completion_date.isnot(None),
    ).all()

    avg_response_hours = 0.0
    if completed:
        total_hours = sum(
            (a.completion_date - a.assignment_date).total_seconds() / 3600
            for a in completed
            if a.completion_date and a.assignment_date
        )
        avg_response_hours = total_hours / len(completed)

    # Calculate average farmer satisfaction
    ratings = db.query(UserRating).all()
    avg_satisfaction = 0.0
    if ratings:
        avg_satisfaction = sum(r.rating for r in ratings) / len(ratings)

    active_advisories = db.query(func.count(Advisory.id)).filter(Advisory.response.is_(None)).scalar() or 0

    return SystemAnalyticsOut(
        total_users=total_users,
        total_farmers=total_farmers,
        total_experts=total_experts,
        total_advisories=total_advisories,
        pending_advisories=pending_advisories,
        avg_expert_response_time_hours=round(avg_response_hours, 2),
        avg_farmer_satisfaction=round(avg_satisfaction, 2),
        active_advisories=active_advisories,
    )


@router.get('/analytics/stats', response_model=AdminStatsOut)
def get_admin_stats(
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin')),
):
    """Get admin dashboard statistics"""
    total_farmers = db.query(func.count(User.id)).filter(User.role == 'farmer').scalar() or 0
    total_experts = db.query(func.count(User.id)).filter(User.role == 'expert').scalar() or 0
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    total_equipment = db.query(func.count(Equipment.id)).scalar() or 0
    approved_equipment = total_equipment
    pending_equipment = 0

    return AdminStatsOut(
        total_farmers=total_farmers,
        total_experts=total_experts,
        total_jobs=total_jobs,
        total_equipment=total_equipment,
        approved_equipment=approved_equipment,
        pending_equipment=pending_equipment,
    )
