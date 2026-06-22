from sqlalchemy import Column, Text, SmallInteger, ForeignKey, TIMESTAMP, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

from app.database import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)
    chunk_index = Column(SmallInteger, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    book = relationship("Book", back_populates="chunks")
