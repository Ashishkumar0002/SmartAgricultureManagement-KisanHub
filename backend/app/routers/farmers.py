from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Farmer
from app.schemas import FarmerIn, FarmerOut
from app.services.deps import require_roles

router = APIRouter(prefix='/farmers', tags=['farmers'])


def _farmer_payload(data: FarmerIn) -> dict:
    payload = data.model_dump(exclude={'soil', 'crop_planning', 'analytics', 'assets'})
    return payload


@router.get('', response_model=list[FarmerOut])
def list_farmers(db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    return db.query(Farmer).order_by(Farmer.id.desc()).all()


@router.post('', response_model=FarmerOut, status_code=status.HTTP_201_CREATED)
def create_farmer(payload: FarmerIn, db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer'))):
    item = Farmer(**_farmer_payload(payload))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put('/{farmer_id}', response_model=FarmerOut)
def update_farmer(
    farmer_id: int,
    payload: FarmerIn,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin', 'farmer')),
):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Farmer not found')

    for key, value in _farmer_payload(payload).items():
        setattr(farmer, key, value)

    db.commit()
    db.refresh(farmer)
    return farmer


@router.delete('/{farmer_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_farmer(farmer_id: int, db: Session = Depends(get_db), _=Depends(require_roles('admin'))):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Farmer not found')

    db.delete(farmer)
    db.commit()
    return None
