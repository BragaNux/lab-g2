from sqlalchemy.orm import Session

from app.config import settings
from app.rag.retriever import retrieve_similar_chunks

_PROMPT_TEMPLATE = """\
Você é o assistente de dicas de um jogo de adivinhação literária.
O jogador está lendo este trecho: "{passage}"

Contexto adicional do livro para ajudar:
{context}

Instruções:
- Escreva uma dica sutil (máximo 2 frases).
- Faça referência à época histórica, estilo literário ou temática da obra.
- Nunca mencione o nome do autor ou o título do livro.
- Responda em Português do Brasil.\
"""


def generate_hint(passage_text: str, book_id: str, db: Session) -> str:
    chunks = retrieve_similar_chunks(passage_text, book_id, db)
    context = "\n\n".join(chunks) if chunks else "Sem contexto adicional disponível."

    prompt = _PROMPT_TEMPLATE.format(passage=passage_text, context=context)

    if not settings.anthropic_api_key:
        return "Dica indisponível: configure a variável ANTHROPIC_API_KEY."

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        return response.content[0].text
    except Exception as e:
        # Fallback caso a API da Anthropic falhe
        from app.models.book import Book
        book = db.query(Book).filter(Book.id == book_id).first()
        if book:
            lang_map = {"pt": "Português", "en": "Inglês", "es": "Espanhol", "fr": "Francês", "de": "Alemão", "it": "Italiano", "ru": "Russo"}
            lang_name = lang_map.get(book.language, book.language)
            return f"Obra publicada originalmente em {book.year}, escrita originalmente em {lang_name}."
        return "Dica indisponível no momento."

