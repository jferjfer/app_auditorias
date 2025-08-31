from passlib.context import CryptContext
from backend import models, schemas

# Contexto de encriptación para contraseñas.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Retorna el hash de la contraseña."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña sin hashear coincide con el hash."""
    return pwd_context.verify(plain_password, hashed_password)