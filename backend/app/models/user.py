from sqlalchemy import Column, String, Integer, SmallInteger, Boolean, Date, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(30), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    xp = Column(Integer, default=0)
    streak = Column(SmallInteger, default=0)
    last_played = Column(Date, nullable=True)
    is_premium = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    allow_ai = Column(Boolean, default=False)
    premium_requested = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
