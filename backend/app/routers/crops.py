from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Crop
from app.schemas import CropIn, CropOut
from app.services.deps import require_roles

router = APIRouter(prefix='/crops', tags=['crops'])


@router.get('', response_model=list[CropOut])
def list_crops(db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    return db.query(Crop).order_by(Crop.id.desc()).all()


@router.post('', response_model=CropOut, status_code=status.HTTP_201_CREATED)
def create_crop(payload: CropIn, db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer'))):
    item = Crop(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put('/{crop_id}', response_model=CropOut)
def update_crop(crop_id: int, payload: CropIn, db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer'))):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Crop not found')

    for key, value in payload.model_dump().items():
        setattr(crop, key, value)

    db.commit()
    db.refresh(crop)
    return crop
