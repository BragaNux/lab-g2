import json
import re
import traceback
from sqlalchemy.orm import Session

from app.config import settings
from app.rag.retriever import retrieve_similar_chunks

_PROMPT_TEMPLATE = """\
Você é o assistente de dicas de um jogo de adivinhação literária.
Jogador está lendo este trecho: "{passage}"

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
        raise ValueError("Anthropic API key is not configured (ANTHROPIC_API_KEY is empty).")

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        return response.content[0].text
    except Exception as e:
        traceback.print_exc()
        raise e


def generate_curiosities(book_title: str, book_author: str) -> list[str]:
    if not settings.anthropic_api_key:
        return ["Curiosidades indisponíveis: configure a variável ANTHROPIC_API_KEY."]

    prompt = f"Forneça exatamente 3 curiosidades rápidas, interessantes e concisas sobre a obra '{book_title}' escrita por '{book_author}'. Retorne apenas uma lista simples em formato JSON, como: [\"Curiosidade 1\", \"Curiosidade 2\", \"Curiosidade 3\"]. Não inclua nenhuma outra introdução ou texto."

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7,
        )
        content = response.content[0].text.strip()
        match = re.search(r'\[\s*".*?"\s*,\s*".*?"\s*,\s*".*?"\s*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        lines = [line.strip().lstrip("-*123. ").strip('"\'') for line in content.split("\n") if line.strip()]
        result = [l for l in lines if l][:3]
        if len(result) == 3:
            return result
        return ["Curiosidade 1 sobre " + book_title, "Curiosidade 2 sobre " + book_title, "Curiosidade 3 sobre " + book_title]
    except Exception as e:
        traceback.print_exc()
        return [
            "Não foi possível carregar as curiosidades sobre esta obra no momento.",
            "A API da Anthropic retornou um erro.",
            "Tente novamente em outro momento."
        ]
