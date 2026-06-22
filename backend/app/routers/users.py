from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/me/simulate-premium", response_model=UserResponse)
def simulate_premium(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.is_premium = True
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/simulate-admin", response_model=UserResponse)
def simulate_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.is_admin = True
    db.commit()
    db.refresh(current_user)
    return current_user



