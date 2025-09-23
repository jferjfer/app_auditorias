from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas, crud
from backend.database import get_db
from backend.services.auth_service import get_current_user

router = APIRouter(
    tags=["Usuarios"],
)

@router.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Obtiene el usuario actual a partir del token JWT.
    """
    return current_user

@router.get("/users/", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Obtiene todos los usuarios (solo para administradores).
    """
    if current_user.rol != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para ver usuarios")
    return crud.get_users(db)

@router.get("/auditors/", response_model=List[schemas.User])
def get_auditors(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Devuelve todos los usuarios con rol 'auditor'. Accesible a cualquier usuario autenticado.
    """
    return crud.get_auditors(db)