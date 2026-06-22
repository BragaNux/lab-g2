from datetime import date
from pydantic import BaseModel
import uuid


class BookIngestResponse(BaseModel):
    book_id: str
    chunks_created: int


class PassageCreateRequest(BaseModel):
    book_id: uuid.UUID
    text: str
    difficulty: int


class DailyChallengeCreateRequest(BaseModel):
    passage_id: uuid.UUID
    date: date


class UpdateStatsRequest(BaseModel):
    xp: int
    streak: int

