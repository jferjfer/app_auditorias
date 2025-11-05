import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend import models, crud
from backend.dependencies import get_db

# Contexto de encriptación para contraseñas.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Retorna el hash de la contraseña."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña sin hashear coincide con el hash."""
    return pwd_context.verify(plain_password, hashed_password)

# --- Lógica JWT ---
import secrets

SECRET_KEY = os.getenv("SECRET_KEY")
if SECRET_KEY is None:
    SECRET_KEY = secrets.token_urlsafe(64)
    import warnings
    warnings.warn(f"SECRET_KEY generada automáticamente. Para producción, establece: SECRET_KEY={SECRET_KEY}")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=correo)
    if user is None:
        raise credentials_exception
    return user

def get_user_from_token(db: Session, token: str) -> Optional[models.User]:
    """
    Decodifica el token y retorna el usuario si es válido.
    No es una dependencia de FastAPI, puede ser llamada desde cualquier parte (ej. WebSockets).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            return None
    except JWTError:
        return None
    user = crud.get_user_by_email(db, email=correo)
    return user