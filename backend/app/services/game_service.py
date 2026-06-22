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
        .filter(Game.user_id == user_id, Game.challenge_id == challenge.id)
        .first()
    )
    if existing and existing.is_correct is not None and not existing.is_history_play:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Você já completou este desafio.")

    is_correct = evaluate_answer(answer, challenge.passage.book.title)

    has_used_hint = used_hint or (existing and existing.used_hint if existing else False)

    points = 0
    if is_correct:
        base_points = challenge.passage.points
        points = base_points // 2 if has_used_hint else base_points

    from sqlalchemy.sql import func
    if not existing:
        game = Game(
            user_id=user_id,
            challenge_id=challenge.id,
            answer=answer,
            is_correct=is_correct,
            used_hint=has_used_hint,
            points_earned=points,
            is_history_play=False,
            played_at=func.now(),
        )
        db.add(game)
    else:
        existing.answer = answer
        existing.is_correct = is_correct
        existing.used_hint = has_used_hint
        existing.points_earned = points
        existing.is_history_play = False
        existing.played_at = func.now()

    user = db.query(User).filter(User.id == user_id).first()
    if points > 0 and user:
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
        "new_streak": user.streak if user else 0,
        "new_xp": user.xp if user else 0,
    }


def submit_history_answer(user_id: str, challenge: DailyChallenge, answer: str, used_hint: bool, db: Session) -> dict:
    existing = (
        db.query(Game)
        .filter(Game.user_id == user_id, Game.challenge_id == challenge.id)
        .first()
    )
    is_correct = evaluate_answer(answer, challenge.passage.book.title)
    has_used_hint = used_hint or (existing and existing.used_hint if existing else False)

    if not existing:
        game = Game(
            user_id=user_id,
            challenge_id=challenge.id,
            answer=answer,
            is_correct=is_correct,
            used_hint=has_used_hint,
            points_earned=0,
            is_history_play=True,
        )
        db.add(game)
    else:
        existing.answer = answer
        existing.is_correct = is_correct
        existing.used_hint = has_used_hint
        existing.points_earned = 0
        existing.is_history_play = True
        
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()

    return {
        "is_correct": is_correct,
        "points_earned": 0,
        "correct_answer": {
            "title": challenge.passage.book.title,
            "author": challenge.passage.book.author,
        },
        "new_streak": user.streak if user else 0,
        "new_xp": user.xp if user else 0,
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
