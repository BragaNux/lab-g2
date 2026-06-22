from sqlalchemy import Column, Text, SmallInteger, Boolean, ForeignKey, TIMESTAMP, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", name="uq_user_challenge"),
        Index("ix_games_user_played", "user_id", "played_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("daily_challenges.id", ondelete="CASCADE"), nullable=False)
    answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    used_hint = Column(Boolean, default=False)
    points_earned = Column(SmallInteger, default=0)
    is_history_play = Column(Boolean, default=False)
    hint_count = Column(SmallInteger, default=0)
    hint_text = Column(Text, nullable=True)
    played_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    challenge = relationship("DailyChallenge", back_populates="games")
