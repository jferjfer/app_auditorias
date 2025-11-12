import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

from backend import crud, schemas, models
from backend.dependencies import get_db
from backend.services.auth_service import get_password_hash, verify_password, create_access_token

# Define el router de la API
router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))



# Login attempt tracking (se limpia automáticamente)
from collections import defaultdict
login_attempts = defaultdict(lambda: [0, None])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Permite a un usuario iniciar sesión y obtener un token JWT.
    """
    import time
    from datetime import datetime
    
    # Rate limiting por email
    email = form_data.username.lower()
    now = datetime.utcnow()
    
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"Login attempt for: {email}")
    
    attempts, last_attempt = login_attempts[email]
    
    # Si es el primer intento o pasó más de 1 minuto, resetear
    if last_attempt is None or (now - last_attempt).total_seconds() >= 60:
        login_attempts[email] = [0, now]
        attempts = 0
    # Bloquear si hay 5+ intentos en menos de 1 minuto
    elif attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Intenta en 1 minuto"
        )
    
    # Timing attack mitigation
    user = crud.get_user_by_email(db, email=email)
    password_valid = False
    
    if user:
        password_valid = verify_password(form_data.password, user.contrasena_hash)
    else:
        # Fake hash check para timing constante
        verify_password(form_data.password, "$2b$12$fake.hash.to.prevent.timing.attack.abcdefghijklmnopqrstuvwxy")
    
    if not user or not password_valid:
        login_attempts[email][0] += 1
        login_attempts[email][1] = now
        time.sleep(0.2)  # Delay reducido para prevenir fuerza bruta
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Limpiar intentos exitosos completamente
    if email in login_attempts:
        del login_attempts[email]
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.correo, "rol": user.rol}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_name": user.nombre,
        "user_role": user.rol,
        "user_id": user.id
    }