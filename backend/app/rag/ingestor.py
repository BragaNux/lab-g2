import io
import mimetypes
from typing import Generator

from sqlalchemy.orm import Session

from app.models.book import Book
from app.models.chunk import Chunk

CHUNK_SIZE = 900
CHUNK_OVERLAP = 100


def _extract_text_from_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="replace")


def _extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf

        reader = pypdf.PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except ImportError:
        raise RuntimeError("pypdf não instalado. Adicione pypdf ao requirements.txt para suporte a PDF.")


def extract_text(content: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        return _extract_text_from_pdf(content)
    return _extract_text_from_txt(content)


def chunk_text(text: str) -> Generator[str, None, None]:
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        yield text[start:end]
        start += CHUNK_SIZE - CHUNK_OVERLAP


def ingest_book(
    db: Session,
    title: str,
    author: str,
    year: int | None,
    language: str,
    file_content: bytes,
    mime_type: str,
) -> dict:
    from sentence_transformers import SentenceTransformer

    text = extract_text(file_content, mime_type)
    chunks = list(chunk_text(text))

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(chunks, show_progress_bar=False, batch_size=32).tolist()

    book = Book(title=title, author=author, year=year, language=language)
    db.add(book)
    db.flush()  # gera o id sem commit

    chunk_objects = [
        Chunk(
            book_id=book.id,
            text=chunk_text_item,
            embedding=embedding,
            chunk_index=idx,
        )
        for idx, (chunk_text_item, embedding) in enumerate(zip(chunks, embeddings))
    ]
    db.bulk_save_objects(chunk_objects)
    db.commit()

    return {"book_id": str(book.id), "chunks_created": len(chunk_objects)}
