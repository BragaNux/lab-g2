from sqlalchemy import text
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def retrieve_similar_chunks(passage_text: str, book_id: str, db: Session, top_k: int = 3) -> list[str]:
    model = _get_model()
    embedding = model.encode(passage_text).tolist()

    rows = db.execute(
        text(
            """
            SELECT text
            FROM chunks
            WHERE book_id = :book_id
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
            """
        ),
        {"book_id": book_id, "embedding": str(embedding), "top_k": top_k},
    ).fetchall()

    return [row[0] for row in rows]
