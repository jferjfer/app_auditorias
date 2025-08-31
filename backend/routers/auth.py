import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError

from backend import crud, schemas, models
from backend.database import get_db
from backend.services.auth_service import get_password_hash, verify_password

# Define el router de la API
router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

# Configuración JWT (debe coincidir con la de main.py)
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-debe-ser-fuerte-y-unica")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema.
    """
    db_user = crud.get_user_by_email(db, email=user.correo)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado."
        )

    hashed_password = get_password_hash(user.contrasena)
    new_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)
    return new_user

@router.post("/login", status_code=status.HTTP_200_OK)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Permite a un usuario iniciar sesión y obtener un token JWT.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.correo, "rol": user.rol}, expires_delta=access_token_expires
    )
    
    # Devuelve el token y el objeto del usuario completo
    return {"access_token": access_token, "token_type": "bearer", "user": user}