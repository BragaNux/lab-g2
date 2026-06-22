from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.ranking import RankingItem, RankingResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=RankingResponse)
def get_ranking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .order_by(User.xp.desc())
        .limit(20)
        .all()
    )

    items = []
    for position, user in enumerate(users, start=1):
        items.append(
            RankingItem(
                position=position,
                user_id=str(user.id),
                username=user.username,
                xp=user.xp,
                streak=user.streak,
                is_me=user.id == current_user.id,
            )
        )

    return RankingResponse(ranking=items, my_xp=current_user.xp)
