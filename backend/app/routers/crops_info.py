from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CropInfo
from app.schemas import CropInfoOut
from app.services.deps import require_roles

router = APIRouter(prefix='/crops-info', tags=['crops-info'])


@router.get('', response_model=list[CropInfoOut])
def list_crop_info(
    db: Session = Depends(get_db),
    search: str = Query(None),
    crop_type: str = Query(None),
    _=Depends(require_roles('admin', 'farmer', 'expert')),
):
    """Get all crop information with optional search and filtering"""
    query = db.query(CropInfo)
    
    if search:
        query = query.filter(CropInfo.name.ilike(f'%{search}%'))
    
    if crop_type:
        query = query.filter(CropInfo.crop_type.ilike(f'%{crop_type}%'))
    
    return query.order_by(CropInfo.name).all()


@router.get('/{crop_info_id}', response_model=CropInfoOut)
def get_crop_info(
    crop_info_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin', 'farmer', 'expert')),
):
    """Get detailed information for a specific crop"""
    crop_info = db.query(CropInfo).filter(CropInfo.id == crop_info_id).first()
    if not crop_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Crop information not found'
        )
    return crop_info


@router.get('/search/by-name/{crop_name}', response_model=CropInfoOut)
def get_crop_by_name(
    crop_name: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles('admin', 'farmer', 'expert')),
):
    """Get crop information by crop name"""
    crop_info = db.query(CropInfo).filter(CropInfo.name.ilike(crop_name)).first()
    if not crop_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Crop information for {crop_name} not found'
        )
    return crop_info
