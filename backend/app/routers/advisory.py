from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Advisory, Expert, Farmer, User
from app.schemas import AdvisoryIn, AdvisoryOut, AdvisoryReplyIn
from app.services.deps import get_current_user, require_roles

router = APIRouter(prefix='/advisory', tags=['advisory'])


@router.get('', response_model=list[AdvisoryOut])
def list_advisories(db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    return db.query(Advisory).order_by(Advisory.created_at.desc()).all()


@router.post('', response_model=AdvisoryOut, status_code=status.HTTP_201_CREATED)
def create_advisory(
    payload: AdvisoryIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _=Depends(require_roles('admin', 'farmer')),
):
    farmer_id = payload.farmer_id
    if user.role == 'farmer' and not farmer_id:
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        if not farmer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Farmer profile not found')
        farmer_id = farmer.id

    item = Advisory(question=payload.question, farmer_id=farmer_id)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put('/{advisory_id}/reply', response_model=AdvisoryOut)
def reply_advisory(
    advisory_id: int,
    payload: AdvisoryReplyIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _=Depends(require_roles('admin', 'expert')),
):
    advisory = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Advisory item not found')

    advisory.response = payload.response
    if user.role == 'expert':
        expert = db.query(Expert).filter(Expert.user_id == user.id).first()
        if not expert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Expert profile not found')
        advisory.expert_id = expert.id
    else:
        advisory.expert_id = user.id

    advisory.status = 'answered'
    db.commit()
    db.refresh(advisory)
    return advisory
