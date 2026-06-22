from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.config import settings
from app.models.game import Game
from app.models.passage import DailyChallenge
from app.models.user import User
from app.utils import get_local_date



def get_today_challenge(db: Session) -> DailyChallenge:
    challenge = (
        db.query(DailyChallenge)
        .filter(DailyChallenge.date == get_local_date(), DailyChallenge.is_active == True)  # noqa: E712
        .first()
    )
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum desafio configurado para hoje.",
        )
    return challenge


def get_challenge_by_id(challenge_id: str, db: Session) -> DailyChallenge:
    challenge = db.query(DailyChallenge).filter(DailyChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Desafio não encontrado.")
    return challenge


def evaluate_answer(user_answer: str, correct_title: str) -> bool:
    score = fuzz.token_sort_ratio(user_answer.strip().lower(), correct_title.strip().lower())
    return score >= settings.fuzzy_threshold


def submit_answer(user_id: str, challenge: DailyChallenge, answer: str, used_hint: bool, db: Session) -> dict:
    existing = (
        db.query(Game)
        .filter(Game.user_id == user_id, Game.challenge_id == challenge.id, Game.is_history_play == False)  # noqa: E712
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Você já completou este desafio.")

    is_correct = evaluate_answer(answer, challenge.passage.book.title)

    points = 0
    if is_correct:
        base_points = challenge.passage.points
        points = base_points // 2 if used_hint else base_points

    game = Game(
        user_id=user_id,
        challenge_id=challenge.id,
        answer=answer,
        is_correct=is_correct,
        used_hint=used_hint,
        points_earned=points,
        is_history_play=False,
    )
    db.add(game)

    if points > 0:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.xp += points
            _update_streak(user)

    db.commit()

    return {
        "is_correct": is_correct,
        "points_earned": points,
        "correct_answer": {
            "title": challenge.passage.book.title,
            "author": challenge.passage.book.author,
        },
    }


def submit_history_answer(user_id: str, challenge: DailyChallenge, answer: str, db: Session) -> dict:
    is_correct = evaluate_answer(answer, challenge.passage.book.title)

    game = Game(
        user_id=user_id,
        challenge_id=challenge.id,
        answer=answer,
        is_correct=is_correct,
        used_hint=False,
        points_earned=0,
        is_history_play=True,
    )
    db.add(game)
    db.commit()

    return {
        "is_correct": is_correct,
        "points_earned": 0,
        "correct_answer": {
            "title": challenge.passage.book.title,
            "author": challenge.passage.book.author,
        },
    }


def _update_streak(user: User) -> None:
    today = get_local_date()
    if user.last_played is None:
        user.streak = 1
    else:
        diff = (today - user.last_played).days
        if diff == 1:
            user.streak += 1
        elif diff > 1:
            user.streak = 1
        # diff == 0: mesmo dia, não altera streak
    user.last_played = today


def get_hint_count(user_id: str, challenge_id: str, db: Session) -> int:
    from app.models.game import Game as GameModel
    game = db.query(GameModel).filter(
        GameModel.user_id == user_id,
        GameModel.challenge_id == challenge_id,
    ).first()
    # Rastreamos via campo hint_count que será adicionado ao model.
    # Por ora retornamos 0 se não há registro ainda.
    return 0
