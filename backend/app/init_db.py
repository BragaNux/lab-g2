"""Executa ao subir o container pela primeira vez para habilitar pgvector e criar tabelas."""
from sqlalchemy import text
from app.database import engine, Base
import app.models  # noqa: F401 — importa todos os models para o Base conhecer as tabelas


def init():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Banco inicializado com sucesso.")


if __name__ == "__main__":
    init()
