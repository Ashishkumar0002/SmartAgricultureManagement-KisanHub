from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Application, Farmer, Job, User, Worker
from app.schemas import (
    ApplicationIn,
    ApplicationOut,
    JobIn,
    JobOut,
    WorkerAvailableJobOut,
    WorkerIn,
    WorkerMyJobOut,
    WorkerOut,
    WorkerProfileIn,
    WorkerProfileOut,
)
from app.services.deps import require_roles

router = APIRouter(prefix='/employment', tags=['employment'])


@router.get('/jobs', response_model=list[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'farmer', 'expert')),
):
    query = db.query(Job)
    if current_user.role == 'admin':
        return query.order_by(Job.id.desc()).all()

    if current_user.role == 'farmer':
        farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
        if farmer:
            return (
                query.filter((Job.status.in_(['open', 'active'])) | (Job.farmer_id == farmer.id))
                .order_by(Job.id.desc())
                .all()
            )

    return query.filter(Job.status.in_(['open', 'active'])).order_by(Job.id.desc()).all()


@router.post('/jobs', response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer')),
):
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Farmer profile not found',
        )

    item = Job(
        **payload.model_dump(),
        farmer_id=farmer.id,
        status='open',
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post('/jobs/{job_id}/apply', response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    job_id: int,
    payload: ApplicationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Job not found',
        )
    if job.status not in ['open', 'active']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Only active jobs can accept applications',
        )

    if current_user.role == 'farmer':
        applicant_farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
        if applicant_farmer and applicant_farmer.id == job.farmer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='You cannot apply to your own job',
            )

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.applicant_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='You have already applied to this job',
        )

    item = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        message=payload.message,
        status='pending',
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get('/applications', response_model=list[ApplicationOut])
def list_applications(
    job_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'farmer', 'expert')),
):
    query = db.query(Application)

    if job_id is not None:
        query = query.filter(Application.job_id == job_id)

    if current_user.role == 'farmer':
        query = query.filter(Application.applicant_id == current_user.id)

    return query.order_by(Application.id.desc()).all()


@router.get('/workers', response_model=list[WorkerOut])
def list_workers(db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    return db.query(Worker).order_by(Worker.id.desc()).all()


@router.post('/workers', response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(payload: WorkerIn, db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    item = Worker(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get('/worker/jobs', response_model=list[WorkerAvailableJobOut])
def list_worker_jobs(
    location: str | None = Query(default=None),
    skill: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    query = db.query(Job).filter(Job.status.in_(['open', 'active']))

    if location:
        query = query.filter(Job.location.ilike(f'%{location}%'))
    if skill:
        query = query.filter((Job.title.ilike(f'%{skill}%')) | (Job.description.ilike(f'%{skill}%')))

    current_farmer = None
    if current_user.role == 'farmer':
        current_farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()

    jobs = query.order_by(Job.created_at.desc()).all()

    result: list[WorkerAvailableJobOut] = []
    for job in jobs:
        farmer = db.query(Farmer).filter(Farmer.id == job.farmer_id).first()

        result.append(
            WorkerAvailableJobOut(
                id=job.id,
                title=job.title,
                description=job.description,
                location=job.location,
                wage=job.wage,
                farmer_name=farmer.name if farmer else 'Unknown Farmer',
                posted_date=job.created_at,
            )
        )

    return result


@router.post('/worker/jobs/{job_id}/apply', response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_worker_job(
    job_id: int,
    payload: ApplicationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
    if job.status not in ['open', 'active']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only active jobs can accept applications')

    if current_user.role == 'farmer':
        current_farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
        if current_farmer and current_farmer.id == job.farmer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot apply to your own job')

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.applicant_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You have already applied to this job')

    item = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        message=payload.message,
        status='pending',
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get('/worker/my-jobs', response_model=list[WorkerMyJobOut])
def list_worker_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    worker_profile = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    applications = (
        db.query(Application)
        .filter(Application.applicant_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )

    result: list[WorkerMyJobOut] = []
    for application in applications:
        job = db.query(Job).filter(Job.id == application.job_id).first()
        if not job:
            continue
        farmer = db.query(Farmer).filter(Farmer.id == job.farmer_id).first()

        status_label = 'applied' if application.status == 'pending' else application.status
        if worker_profile and worker_profile.assigned_job_id == job.id:
            status_label = 'working'

        started_at = application.created_at if status_label == 'working' else None

        result.append(
            WorkerMyJobOut(
                application_id=application.id,
                job_id=job.id,
                job_title=job.title,
                farmer_name=farmer.name if farmer else 'Unknown Farmer',
                status=status_label,
                applied_at=application.created_at,
                started_at=started_at,
            )
        )

    return result


@router.get('/worker/profile', response_model=WorkerProfileOut)
def get_worker_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    profile = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if profile:
        return WorkerProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            name=profile.name,
            contact=profile.contact,
            location=profile.location,
            skills=profile.skills,
            experience=profile.experience,
            availability_status='working' if profile.availability_status == 'busy' else profile.availability_status,
            profile_image=profile.profile_image,
            bio=profile.bio,
            assigned_job_id=profile.assigned_job_id,
            created_at=profile.created_at,
        )

    profile = Worker(
        user_id=current_user.id,
        name=current_user.full_name,
        contact=current_user.phone or '',
        location=None,
        skills=None,
        experience=None,
        availability_status='available',
        bio=None,
        profile_image=None,
        is_blocked=False,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return WorkerProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        contact=profile.contact,
        location=profile.location,
        skills=profile.skills,
        experience=profile.experience,
        availability_status='working' if profile.availability_status == 'busy' else profile.availability_status,
        profile_image=profile.profile_image,
        bio=profile.bio,
        assigned_job_id=profile.assigned_job_id,
        created_at=profile.created_at,
    )


@router.put('/worker/profile', response_model=WorkerProfileOut)
def upsert_worker_profile(
    payload: WorkerProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('farmer', 'expert')),
):
    profile = db.query(Worker).filter(Worker.user_id == current_user.id).first()

    if profile is None:
        profile = Worker(
            user_id=current_user.id,
            name=payload.name,
            contact=payload.contact,
            location=payload.location,
            skills=payload.skills,
            experience=payload.experience,
            availability_status='available' if payload.availability_status == 'available' else payload.availability_status,
            profile_image=payload.profile_image,
            bio=payload.bio,
            is_blocked=False,
        )
        db.add(profile)
    else:
        profile.name = payload.name
        profile.contact = payload.contact
        profile.location = payload.location
        profile.skills = payload.skills
        profile.experience = payload.experience
        profile.availability_status = 'busy' if payload.availability_status == 'working' else payload.availability_status
        profile.profile_image = payload.profile_image
        profile.bio = payload.bio

    db.commit()
    db.refresh(profile)
    return WorkerProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        contact=profile.contact,
        location=profile.location,
        skills=profile.skills,
        experience=profile.experience,
        availability_status='working' if profile.availability_status == 'busy' else profile.availability_status,
        profile_image=profile.profile_image,
        bio=profile.bio,
        assigned_job_id=profile.assigned_job_id,
        created_at=profile.created_at,
    )
