from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.services.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    username = payload.get('sub')
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    return user


def require_roles(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Insufficient permissions')
        return user

    return checker


def admin_only(user: User = Depends(get_current_user)) -> User:
    if user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return user


def expert_only(user: User = Depends(get_current_user)) -> User:
    if user.role != 'expert':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Expert access required')
    return user


def farmer_only(user: User = Depends(get_current_user)) -> User:
    if user.role != 'farmer':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Farmer access required')
    return user


# Backward-friendly aliases using requested middleware naming.
adminOnly = admin_only
expertOnly = expert_only
farmerOnly = farmer_only
