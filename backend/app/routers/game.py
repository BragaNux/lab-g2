from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.game import Game
from app.models.passage import DailyChallenge
from app.models.user import User
from app.rag.hint_generator import generate_hint, generate_curiosities
from app.schemas.game import (
    ChallengeResponse,
    HintResponse,
    HistoryChallengeItem,
    SubmitRequest,
    SubmitResponse,
)
from app.services.auth_service import get_current_user, require_premium
from app.services.game_service import (
    get_challenge_by_id,
    get_today_challenge,
    submit_answer,
    submit_history_answer,
)
from app.utils import get_local_date

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/today", response_model=ChallengeResponse)
def today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = get_today_challenge(db)
    game = (
        db.query(Game)
        .filter(
            Game.user_id == current_user.id,
            Game.challenge_id == challenge.id,
            Game.is_history_play == False,  # noqa: E712
        )
        .first()
    )
    already_played = game is not None and game.is_correct is not None
    return ChallengeResponse(
        id=str(challenge.id),
        passage_text=challenge.passage.text,
        difficulty=challenge.passage.difficulty,
        points_available=challenge.passage.points,
        already_played=already_played,
        allow_ai=current_user.allow_ai,
        used_hint=game.used_hint if game else False,
        hint_text=game.hint_text if game else None,
        hint_count=game.hint_count if game else 0,
    )


@router.post("/today/submit", response_model=SubmitResponse)
@limiter.limit("10/minute")
def submit(
    request: Request,
    body: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    challenge = get_today_challenge(db)
    return submit_answer(str(current_user.id), challenge, body.answer, body.used_hint, db)


@router.post("/today/hint", response_model=HintResponse)
@limiter.limit("3/minute")
def hint(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.allow_ai:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ajuda com IA não está disponível para esta conta.",
        )

    challenge = get_today_challenge(db)

    game = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id == challenge.id,
        Game.is_history_play == False,
    ).first()

    if game and game.hint_text:
        return HintResponse(hint=game.hint_text)

    limit = settings.hint_limit_premium if current_user.is_premium else settings.hint_limit_free
    current_hints = game.hint_count if game else 0

    if current_hints >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite de {limit} dica(s) atingido para este desafio.",
        )

    hint_text = generate_hint(
        passage_text=challenge.passage.text,
        book_id=str(challenge.passage.book_id),
        db=db,
    )

    if not game:
        game = Game(
            user_id=current_user.id,
            challenge_id=challenge.id,
            used_hint=True,
            hint_count=1,
            is_history_play=False,
            hint_text=hint_text,
        )
        db.add(game)
    else:
        game.used_hint = True
        game.hint_count = current_hints + 1
        game.hint_text = hint_text

    db.commit()
    return HintResponse(hint=hint_text)



@router.get("/history", response_model=list[HistoryChallengeItem])
def history(
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    challenges = (
        db.query(DailyChallenge)
        .filter(DailyChallenge.date < get_local_date(), DailyChallenge.is_active == True)  # noqa: E712
        .order_by(DailyChallenge.date.desc())
        .limit(30)
        .all()
    )
    
    challenge_ids = [c.id for c in challenges]
    user_games = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id.in_(challenge_ids)
    ).all()
    
    games_map = {g.challenge_id: g for g in user_games}
    
    return [
        HistoryChallengeItem(
            id=str(c.id),
            date=c.date,
            difficulty=c.passage.difficulty,
            completed=c.id in games_map and games_map[c.id].is_correct is not None,
            is_correct=games_map[c.id].is_correct if c.id in games_map else None,
        )
        for c in challenges
    ]



@router.get("/history/{challenge_id}", response_model=ChallengeResponse)
def get_history_challenge(
    challenge_id: str,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    challenge = get_challenge_by_id(challenge_id, db)
    if challenge.date >= get_local_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este desafio ainda não está disponível no histórico.")
    game = (
        db.query(Game)
        .filter(Game.user_id == current_user.id, Game.challenge_id == challenge.id)
        .first()
    )
    already_played = game is not None and game.is_correct is not None
    return ChallengeResponse(
        id=str(challenge.id),
        passage_text=challenge.passage.text,
        difficulty=challenge.passage.difficulty,
        points_available=challenge.passage.points,
        already_played=already_played,
        allow_ai=current_user.allow_ai,
        used_hint=game.used_hint if game else False,
        hint_text=game.hint_text if game else None,
        hint_count=game.hint_count if game else 0,
    )


@router.post("/history/{challenge_id}/play", response_model=SubmitResponse)
def play_history(
    challenge_id: str,
    body: SubmitRequest,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    challenge = get_challenge_by_id(challenge_id, db)
    if challenge.date >= get_local_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use /today para o desafio do dia.")
    return submit_history_answer(str(current_user.id), challenge, body.answer, body.used_hint, db)


@router.post("/history/{challenge_id}/hint", response_model=HintResponse)
@limiter.limit("3/minute")
def history_hint(
    challenge_id: str,
    request: Request,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    if not current_user.allow_ai:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ajuda com IA não está disponível para esta conta.",
        )

    challenge = get_challenge_by_id(challenge_id, db)
    if challenge.date >= get_local_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use /today para o desafio do dia.")

    game = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id == challenge.id,
    ).first()

    if game and game.hint_text:
        return HintResponse(hint=game.hint_text)

    limit = settings.hint_limit_premium
    current_hints = game.hint_count if game else 0

    if current_hints >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite de {limit} dica(s) atingido para este desafio.",
        )

    hint_text = generate_hint(
        passage_text=challenge.passage.text,
        book_id=str(challenge.passage.book_id),
        db=db,
    )

    if not game:
        game = Game(
            user_id=current_user.id,
            challenge_id=challenge.id,
            used_hint=True,
            hint_count=1,
            is_history_play=True,
            hint_text=hint_text,
        )
        db.add(game)
    else:
        game.used_hint = True
        game.hint_count = current_hints + 1
        game.hint_text = hint_text

    db.commit()
    return HintResponse(hint=hint_text)


@router.post("/history/{challenge_id}/reset")
def reset_history_challenge(
    challenge_id: str,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    challenge = get_challenge_by_id(challenge_id, db)
    game = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id == challenge.id,
    ).first()
    if game:
        db.delete(game)
        db.commit()
    return {"message": "Desafio do histórico resetado. Você pode jogar novamente por diversão!"}


@router.get("/curiosities/{challenge_id}", response_model=list[str])
def get_curiosities(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.allow_ai:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso a curiosidades da IA não permitido para esta conta.",
        )
    challenge = db.query(DailyChallenge).filter(DailyChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Desafio não encontrado.")
    
    book = challenge.passage.book
    return generate_curiosities(book.title, book.author)


