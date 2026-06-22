from sqlalchemy import Column, String, SmallInteger, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    author = Column(String(255), nullable=False)
    year = Column(SmallInteger, nullable=True)
    language = Column(String(10), default="pt")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    passages = relationship("Passage", back_populates="book", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="book", cascade="all, delete-orphan")
