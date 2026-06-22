import mimetypes

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.passage import DailyChallenge, Passage
from app.models.game import Game
from app.models.book import Book
from app.models.user import User
from app.schemas.admin import BookIngestResponse, PassageCreateRequest, DailyChallengeCreateRequest
from app.schemas.auth import UserResponse
from app.services.auth_service import require_admin
from app.rag.ingestor import ingest_book

router = APIRouter()

ALLOWED_MIME_TYPES = {"text/plain", "application/pdf"}


@router.post("/books/ingest", response_model=BookIngestResponse)
async def ingest(
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    year: int | None = Form(None),
    language: str = Form("pt"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    content = await file.read()

    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Arquivo muito grande.")

    # Valida MIME server-side pelo conteúdo, não pelo Content-Type do cliente
    guessed, _ = mimetypes.guess_type(file.filename or "")
    mime = guessed or "text/plain"
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Apenas .txt e .pdf são aceitos.")

    result = ingest_book(
        db=db,
        title=title,
        author=author,
        year=year,
        language=language,
        file_content=content,
        mime_type=mime,
    )
    return result


@router.post("/passages", status_code=status.HTTP_201_CREATED)
def create_passage(
    body: PassageCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == body.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não encontrado.")

    passage = Passage(book_id=body.book_id, text=body.text, difficulty=body.difficulty)
    db.add(passage)
    db.commit()
    db.refresh(passage)
    return {"id": str(passage.id), "points": passage.points}


@router.post("/daily-challenges", status_code=status.HTTP_201_CREATED)
def create_daily_challenge(
    body: DailyChallengeCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if db.query(DailyChallenge).filter(DailyChallenge.date == body.date).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um desafio para essa data.")

    passage = db.query(Passage).filter(Passage.id == body.passage_id).first()
    if not passage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trecho não encontrado.")

    challenge = DailyChallenge(passage_id=body.passage_id, date=body.date)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return {"id": str(challenge.id), "date": str(challenge.date)}


@router.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return db.query(User).order_by(User.username).all()


@router.post("/users/{user_id}/toggle-ai", response_model=UserResponse)
def toggle_user_ai(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    user.allow_ai = not user.allow_ai
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/toggle-premium", response_model=UserResponse)
def toggle_user_premium(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    user.is_premium = not user.is_premium
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/toggle-admin", response_model=UserResponse)
def toggle_user_admin(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    if user.username != settings.admin_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível promover outros usuários a administrador. Apenas o administrador configurado no sistema é permitido.",
        )
    if str(user.id) == str(admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode remover seus próprios privilégios de administrador.",
        )
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.post("/challenges/today/reset")
def reset_today_challenge(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    from app.utils import get_local_date
    from app.models.game import Game
    import random
    from datetime import timedelta, date
    from sqlalchemy.sql import func

    # 1. Get today's date
    today = get_local_date()

    # 2. Find today's challenge
    challenge = db.query(DailyChallenge).filter(DailyChallenge.date == today).first()
    if not challenge:
        raise HTTPException(status_code=400, detail="Nenhum desafio configurado para hoje.")

    # 3. Find all games played today for today's challenge, and deduct XP / reset streaks
    games = db.query(Game).filter(Game.challenge_id == challenge.id).all()
    for g in games:
        user = db.query(User).filter(User.id == g.user_id).first()
        if user:
            # Deduct points earned today
            user.xp = max(0, user.xp - g.points_earned)
            # Decrement streak if they got it correct today
            if g.is_correct:
                user.streak = max(0, user.streak - 1)
                # Set last_played back by 1 day, or None if streak becomes 0
                if user.streak > 0:
                    user.last_played = today - timedelta(days=1)
                else:
                    user.last_played = None

    # 4. Delete today's game records
    db.query(Game).filter(Game.challenge_id == challenge.id).delete()

    # 5. Swap today's challenge with a random active history challenge (date < today)
    history_challenge = (
        db.query(DailyChallenge)
        .filter(DailyChallenge.date < today, DailyChallenge.is_active == True)
        .order_by(func.random())
        .first()
    )

    if history_challenge:
        orig_history_date = history_challenge.date

        # Temp update chosen to temp date to avoid unique constraint collision
        history_challenge.date = date(2000, 1, 1)
        db.flush()

        # Swap today to the old history date
        challenge.date = orig_history_date
        db.flush()

        # Swap chosen to today
        history_challenge.date = today
        db.flush()

        msg = f"Desafio de hoje resetado com sucesso! Trocado com o desafio de {orig_history_date.strftime('%d/%m/%Y')}."
    else:
        # Fallback to choosing another random passage if no historical challenge exists
        passages = db.query(Passage).filter(Passage.id != challenge.passage_id).all()
        if not passages:
            passages = db.query(Passage).all()
        if passages:
            new_passage = random.choice(passages)
            challenge.passage_id = new_passage.id
        msg = "Desafio de hoje resetado. Sem desafios anteriores para trocar, outro trecho literário foi sorteado."

    db.commit()
    return {"message": msg}


@router.post("/users/reset-stats")
def reset_users_stats(
    user_id: str | None = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if user_id:
        # Reset single user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        # Delete their game entries
        db.query(Game).filter(Game.user_id == user.id).delete()
        # Reset stats
        user.xp = 0
        user.streak = 0
        user.last_played = None
        db.commit()
        return {"message": f"Usuário {user.username} resetado com sucesso!"}
    else:
        # Reset all users
        db.query(Game).delete()
        db.query(User).update({
            User.xp: 0,
            User.streak: 0,
            User.last_played: None
        })
        db.commit()
        return {"message": "Ranking, ofensivas e XP de todos os usuários resetados com sucesso!"}

