from datetime import date
from pydantic import BaseModel


class ChallengeResponse(BaseModel):
    id: str
    passage_text: str
    difficulty: int
    points_available: int
    already_played: bool
    allow_ai: bool = False
    used_hint: bool = False
    hint_text: str | None = None
    hint_count: int = 0

    model_config = {"from_attributes": True}


class SubmitRequest(BaseModel):
    answer: str
    used_hint: bool = False


class SubmitResponse(BaseModel):
    is_correct: bool
    points_earned: int
    correct_answer: dict
    new_streak: int = 0
    new_xp: int = 0


class HintResponse(BaseModel):
    hint: str


class HistoryChallengeItem(BaseModel):
    id: str
    date: date
    difficulty: int
    completed: bool = False
    is_correct: bool | None = None

