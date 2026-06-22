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
from app.rag.hint_generator import generate_hint
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
    already_played = (
        db.query(Game)
        .filter(
            Game.user_id == current_user.id,
            Game.challenge_id == challenge.id,
            Game.is_history_play == False,  # noqa: E712
        )
        .first()
        is not None
    )
    return ChallengeResponse(
        id=str(challenge.id),
        passage_text=challenge.passage.text,
        difficulty=challenge.passage.difficulty,
        points_available=challenge.passage.points,
        already_played=already_played,
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
    challenge = get_today_challenge(db)

    game = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id == challenge.id,
    ).first()

    limit = settings.hint_limit_premium if current_user.is_premium else settings.hint_limit_free
    current_hints = game.hint_count if game else 0

    if current_hints >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite de {limit} dica(s) atingido para este desafio.",
        )

    if not game:
        game = Game(
            user_id=current_user.id,
            challenge_id=challenge.id,
            used_hint=True,
            hint_count=1,
            is_history_play=False,
        )
        db.add(game)
    else:
        game.used_hint = True
        game.hint_count = current_hints + 1

    db.commit()

    if not current_user.allow_ai:
        from app.models.book import Book
        book = db.query(Book).filter(Book.id == challenge.passage.book_id).first()
        if book:
            lang_map = {"pt": "Português", "en": "Inglês", "es": "Espanhol", "fr": "Francês", "de": "Alemão", "it": "Italiano", "ru": "Russo"}
            lang_name = lang_map.get(book.language, book.language)
            hint_text = f"DICA OFFLINE: Obra publicada em {book.year}, escrita originalmente em {lang_name}."
        else:
            hint_text = "Dica offline: sem informações do livro."
    else:
        hint_text = generate_hint(
            passage_text=challenge.passage.text,
            book_id=str(challenge.passage.book_id),
            db=db,
        )
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
    return [
        HistoryChallengeItem(
            id=str(c.id),
            date=c.date,
            difficulty=c.passage.difficulty,
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
    already_played = (
        db.query(Game)
        .filter(Game.user_id == current_user.id, Game.challenge_id == challenge.id)
        .first() is not None
    )
    return ChallengeResponse(
        id=str(challenge.id),
        passage_text=challenge.passage.text,
        difficulty=challenge.passage.difficulty,
        points_available=challenge.passage.points,
        already_played=already_played,
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
    return submit_history_answer(str(current_user.id), challenge, body.answer, db)


@router.post("/history/{challenge_id}/hint", response_model=HintResponse)
@limiter.limit("3/minute")
def history_hint(
    challenge_id: str,
    request: Request,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    challenge = get_challenge_by_id(challenge_id, db)
    if challenge.date >= get_local_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use /today para o desafio do dia.")

    game = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.challenge_id == challenge.id,
    ).first()

    limit = settings.hint_limit_premium
    current_hints = game.hint_count if game else 0

    if current_hints >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite de {limit} dica(s) atingido para este desafio.",
        )

    if not game:
        game = Game(
            user_id=current_user.id,
            challenge_id=challenge.id,
            used_hint=True,
            hint_count=1,
            is_history_play=True,
        )
        db.add(game)
    else:
        game.used_hint = True
        game.hint_count = current_hints + 1

    db.commit()

    if not current_user.allow_ai:
        from app.models.book import Book
        book = db.query(Book).filter(Book.id == challenge.passage.book_id).first()
        if book:
            lang_map = {"pt": "Português", "en": "Inglês", "es": "Espanhol", "fr": "Francês", "de": "Alemão", "it": "Italiano", "ru": "Russo"}
            lang_name = lang_map.get(book.language, book.language)
            hint_text = f"DICA OFFLINE: Obra publicada em {book.year}, escrita originalmente em {lang_name}."
        else:
            hint_text = "Dica offline: sem informações do livro."
    else:
        hint_text = generate_hint(
            passage_text=challenge.passage.text,
            book_id=str(challenge.passage.book_id),
            db=db,
        )
    return HintResponse(hint=hint_text)

