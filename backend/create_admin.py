import sys
import os

# Adiciona o diretório atual ao python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

def create_admin():
    db = SessionLocal()
    try:
        username = "brayan"
        email = "brayan@panela.host"
        password = "BookGuessSecurePassword2026!"
        
        user = db.query(User).filter(User.username == username).first()
        if user:
            print(f"Usuário '{username}' já existe. Atualizando privilégios e senha...")
            user.password_hash = hash_password(password)
            user.is_admin = True
            user.is_premium = True
            user.allow_ai = True
        else:
            print(f"Criando novo usuário administrador '{username}'...")
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                is_admin=True,
                is_premium=True,
                allow_ai=True
            )
            db.add(user)
        
        db.commit()
        print("Sucesso! Conta de administrador configurada com sucesso.")
        print(f"Username: {username}")
        print(f"E-mail: {email}")
        print(f"Senha: {password}")
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar administrador: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
