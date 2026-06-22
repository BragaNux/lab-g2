import sys
import os

# Adiciona o diretório atual ao python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import verify_password

def test():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "brayan@panela.host").first()
        if not user:
            print("Usuário não encontrado no banco!")
            return
        print(f"Usuário encontrado! Username: {user.username}, Email: {user.email}")
        password_ok = verify_password("BookGuessSecurePassword2026!", user.password_hash)
        print(f"Senha correta? {password_ok}")
    except Exception as e:
        print(f"Erro no teste: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test()
