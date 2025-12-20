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



# Seguimiento de intentos de login (se limpia automáticamente)
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
    import logging
    
    logger = logging.getLogger("uvicorn")
    email = form_data.username.lower()
    now = datetime.utcnow()
    
    logger.info(f"Login attempt for: {email}")
    
    # Rate limiting
    attempts, last_attempt = login_attempts[email]
    if last_attempt is None or (now - last_attempt).total_seconds() >= 60:
        login_attempts[email] = [0, now]
        attempts = 0
    elif attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Intenta en 1 minuto"
        )
    
    # Verificar conexión a BD
    try:
        user = crud.get_user_by_email(db, email=email)
    except Exception as e:
        logger.error(f"Error de base de datos: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error de servidor. Intenta más tarde"
        )
    
    # Usuario no existe
    if not user:
        login_attempts[email][0] += 1
        login_attempts[email][1] = now
        time.sleep(0.2)
        logger.warning(f"Usuario no encontrado: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    # Verificar contraseña
    try:
        password_valid = verify_password(form_data.password, user.contrasena_hash)
    except Exception as e:
        logger.error(f"Error verificando contraseña para {email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de servidor. Intenta más tarde"
        )
    
    # Contraseña incorrecta
    if not password_valid:
        login_attempts[email][0] += 1
        login_attempts[email][1] = now
        time.sleep(0.2)
        logger.warning(f"Contraseña incorrecta para: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    # Login exitoso
    if email in login_attempts:
        del login_attempts[email]
    
    try:
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.correo, "rol": user.rol}, 
            expires_delta=access_token_expires
        )
    except Exception as e:
        logger.error(f"Error generando token para {email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de servidor. Intenta más tarde"
        )
    
    logger.info(f"Login exitoso: {email}")
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_name": user.nombre,
        "user_role": user.rol,
        "user_id": user.id
    }