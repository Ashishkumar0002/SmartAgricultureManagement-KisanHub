from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import MarketPrice, MarketSale
from app.schemas import MarketPriceOut, MarketSaleIn
from app.services.deps import require_roles

router = APIRouter(prefix='/market', tags=['market'])


@router.get('/prices', response_model=list[MarketPriceOut])
def list_prices(db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer', 'expert'))):
    return db.query(MarketPrice).order_by(MarketPrice.updated_at.desc()).all()


@router.post('/sell', status_code=status.HTTP_201_CREATED)
def sell_product(payload: MarketSaleIn, db: Session = Depends(get_db), _=Depends(require_roles('admin', 'farmer'))):
    sale = MarketSale(**payload.model_dump())
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return {
        'message': 'Product sale submitted',
        'id': sale.id,
        'created_at': sale.created_at,
    }


@router.post('/prices/seed', status_code=status.HTTP_201_CREATED)
def seed_prices(db: Session = Depends(get_db), _=Depends(require_roles('admin'))):
    defaults = [
        {'crop_name': 'Wheat', 'price': 2150.0, 'market_name': 'Punjab Mandi'},
        {'crop_name': 'Rice', 'price': 1980.0, 'market_name': 'Haryana Market'},
        {'crop_name': 'Maize', 'price': 1760.0, 'market_name': 'UP Agri Hub'},
    ]
    for item in defaults:
        db.add(MarketPrice(**item, updated_at=datetime.utcnow()))
    db.commit()
    return {'message': 'Seeded market prices'}
