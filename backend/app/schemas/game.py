from datetime import date
from pydantic import BaseModel


class ChallengeResponse(BaseModel):
    id: str
    passage_text: str
    difficulty: int
    points_available: int
    already_played: bool

    model_config = {"from_attributes": True}


class SubmitRequest(BaseModel):
    answer: str
    used_hint: bool = False


class SubmitResponse(BaseModel):
    is_correct: bool
    points_earned: int
    correct_answer: dict


class HintResponse(BaseModel):
    hint: str


class HistoryChallengeItem(BaseModel):
    id: str
    date: date
    difficulty: int
