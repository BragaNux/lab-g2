from sqlalchemy import Column, Text, SmallInteger, Date, Boolean, ForeignKey, TIMESTAMP, CheckConstraint, Computed
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Passage(Base):
    __tablename__ = "passages"
    __table_args__ = (CheckConstraint("difficulty BETWEEN 1 AND 5"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    difficulty = Column(SmallInteger, nullable=False)
    points = Column(SmallInteger, Computed("difficulty * 20", persisted=True))
    used_on = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    book = relationship("Book", back_populates="passages")
    daily_challenges = relationship("DailyChallenge", back_populates="passage")


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    passage_id = Column(UUID(as_uuid=True), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)

    passage = relationship("Passage", back_populates="daily_challenges")
    games = relationship("Game", back_populates="challenge")
