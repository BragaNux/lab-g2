import mimetypes

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.passage import DailyChallenge, Passage
from app.models.game import Game
from app.models.book import Book
from app.models.user import User
from app.schemas.admin import BookIngestResponse, PassageCreateRequest, DailyChallengeCreateRequest, UpdateStatsRequest
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
    if user.is_premium:
        user.premium_requested = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/toggle-admin", response_model=UserResponse)
def toggle_user_admin(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if admin_user.username != settings.admin_username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal (brayan) pode promover ou rebaixar outros administradores."
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    if user.username == settings.admin_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível alterar os privilégios de administrador da conta master."
        )
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/update-stats", response_model=UserResponse)
def update_user_stats(
    user_id: str,
    body: UpdateStatsRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    
    user.xp = max(0, body.xp)
    user.streak = max(0, body.streak)
    
    from app.utils import get_local_date
    from datetime import timedelta
    if user.streak > 0:
        if not user.last_played:
            user.last_played = get_local_date() - timedelta(days=1)
    else:
        user.last_played = None
        
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


@router.post("/challenges/today/reset-by-era")
def reset_today_challenge_by_era(
    era: str,  # "modern" (year >= 1980) or "classic" (year < 1980)
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Reset today's challenge and pick a passage from books of a specific era."""
    from app.utils import get_local_date
    from app.models.game import Game
    import random
    from datetime import timedelta

    if era not in ("modern", "classic"):
        raise HTTPException(status_code=400, detail="Era inválida. Use 'modern' ou 'classic'.")

    today = get_local_date()

    # Find today's challenge
    challenge = db.query(DailyChallenge).filter(DailyChallenge.date == today).first()
    if not challenge:
        raise HTTPException(status_code=400, detail="Nenhum desafio configurado para hoje.")

    # Deduct XP and streak from users who played today
    games = db.query(Game).filter(Game.challenge_id == challenge.id).all()
    for g in games:
        user = db.query(User).filter(User.id == g.user_id).first()
        if user:
            user.xp = max(0, user.xp - g.points_earned)
            if g.is_correct:
                user.streak = max(0, user.streak - 1)
                if user.streak > 0:
                    user.last_played = today - timedelta(days=1)
                else:
                    user.last_played = None

    # Delete today's game records
    db.query(Game).filter(Game.challenge_id == challenge.id).delete()

    # Filter books by era
    year_threshold = 1980
    if era == "modern":
        eligible_books = db.query(Book).filter(Book.year >= year_threshold).all()
        era_label = "livros modernos (a partir de 1980)"
    else:
        eligible_books = db.query(Book).filter(Book.year < year_threshold).all()
        era_label = "livros clássicos (anteriores a 1980)"

    if not eligible_books:
        raise HTTPException(status_code=404, detail=f"Nenhum livro encontrado para era '{era}'.")

    # Get passages from eligible books
    eligible_book_ids = [b.id for b in eligible_books]
    eligible_passages = (
        db.query(Passage)
        .filter(Passage.book_id.in_(eligible_book_ids), Passage.id != challenge.passage_id)
        .all()
    )

    if not eligible_passages:
        eligible_passages = db.query(Passage).filter(Passage.book_id.in_(eligible_book_ids)).all()

    if not eligible_passages:
        raise HTTPException(status_code=404, detail=f"Nenhum trecho encontrado para {era_label}.")

    new_passage = random.choice(eligible_passages)
    challenge.passage_id = new_passage.id

    db.commit()
    db.refresh(new_passage)
    book_title = new_passage.book.title if new_passage.book else "livro desconhecido"
    return {
        "message": f"Desafio de hoje resetado com um trecho de {era_label}! Novo livro: '{book_title}'."
    }


@router.post("/challenges/history/reset-by-era")
def reset_history_challenges_by_era(
    era: str,  # "modern" (year >= 1980) or "classic" (year < 1980)
    days: int = 7,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Reassign the passages of the past `days` history challenges to
    randomly chosen passages from books of the given era.
    No XP or streak changes are made (history challenges don't award XP).
    """
    from app.utils import get_local_date
    import random

    if era not in ("modern", "classic"):
        raise HTTPException(status_code=400, detail="Era inválida. Use 'modern' ou 'classic'.")
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="'days' deve estar entre 1 e 90.")

    today = get_local_date()

    # Collect the past N days of history challenges (excluding today)
    from datetime import timedelta
    start_date = today - timedelta(days=days)
    history_challenges = (
        db.query(DailyChallenge)
        .filter(DailyChallenge.date >= start_date, DailyChallenge.date < today)
        .order_by(DailyChallenge.date)
        .all()
    )

    if not history_challenges:
        raise HTTPException(status_code=404, detail="Nenhum desafio histórico encontrado para o período.")

    # Filter books by era
    year_threshold = 1980
    if era == "modern":
        eligible_books = db.query(Book).filter(Book.year >= year_threshold).all()
        era_label = "literatura moderna (pós 1980)"
    else:
        eligible_books = db.query(Book).filter(Book.year < year_threshold).all()
        era_label = "literatura clássica (pré 1980)"

    if not eligible_books:
        raise HTTPException(status_code=404, detail=f"Nenhum livro encontrado para a era '{era}'.")

    eligible_book_ids = [b.id for b in eligible_books]
    eligible_passages = (
        db.query(Passage)
        .filter(Passage.book_id.in_(eligible_book_ids))
        .all()
    )

    if not eligible_passages:
        raise HTTPException(status_code=404, detail=f"Nenhum trecho encontrado para {era_label}.")

    # Reassign each history challenge to a random passage from the eligible pool
    # Use a different passage for each day to avoid repetitions where possible
    shuffled = eligible_passages.copy()
    random.shuffle(shuffled)

    updated = 0
    for i, challenge in enumerate(history_challenges):
        passage = shuffled[i % len(shuffled)]
        challenge.passage_id = passage.id
        updated += 1

    db.commit()
    return {
        "message": f"{updated} desafio(s) do histórico (últimos {days} dias) atualizados para {era_label}!"
    }


@router.post("/users/reset-stats")
def reset_users_stats(
    user_id: str | None = None,
    target: str | None = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if user_id:
        # Reset single user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        if target == "streak":
            user.streak = 0
            user.last_played = None
            db.commit()
            return {"message": f"Ofensiva do usuário {user.username} resetada com sucesso!"}
        else:
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
        if target == "streak":
            db.query(User).update({
                User.streak: 0,
                User.last_played: None
            })
            db.commit()
            return {"message": "Ofensivas de todos os usuários resetadas com sucesso!"}
        else:
            db.query(Game).delete()
            db.query(User).update({
                User.xp: 0,
                User.streak: 0,
                User.last_played: None
            })
            db.commit()
            return {"message": "Ranking, ofensivas e XP de todos os usuários resetados com sucesso!"}

