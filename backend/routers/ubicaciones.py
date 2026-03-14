from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend import models, schemas, crud
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user

router = APIRouter(
    prefix="/ubicaciones",
    tags=["Ubicaciones"],
)

@router.get("/", response_model=List[schemas.Ubicacion])
def get_ubicaciones(
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene todas las ubicaciones, opcionalmente filtradas por tipo."""
    return crud.get_ubicaciones(db, tipo=tipo)

@router.post("/", response_model=schemas.Ubicacion, status_code=status.HTTP_201_CREATED)
def create_ubicacion(
    ubicacion: schemas.UbicacionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crea una nueva ubicación (solo administradores)."""
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear ubicaciones"
        )
    
    return crud.create_ubicacion(db, ubicacion=ubicacion, user_id=current_user.id)

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_ubicaciones_bulk(
    nombres: List[str],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crea múltiples sedes a la vez (solo administradores)."""
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear ubicaciones"
        )
    
    created = []
    duplicates = []
    
    for nombre in nombres:
        nombre_clean = nombre.strip()
        if not nombre_clean:
            continue
        
        # Verificar si ya existe
        existing = db.query(models.Ubicacion).filter(models.Ubicacion.nombre == nombre_clean).first()
        if existing:
            duplicates.append(nombre_clean)
            continue
        
        ubicacion = models.Ubicacion(
            nombre=nombre_clean,
            tipo='sede',
            creado_por=current_user.id
        )
        db.add(ubicacion)
        created.append(nombre_clean)
    
    db.commit()
    
    return {
        "created": len(created),
        "duplicates": len(duplicates),
        "duplicate_names": duplicates
    }

@router.delete("/{ubicacion_id}", response_model=schemas.Ubicacion)
def delete_ubicacion(
    ubicacion_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Elimina una ubicación (solo administradores)."""
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar ubicaciones"
        )
    
    db_ubicacion = crud.delete_ubicacion(db, ubicacion_id=ubicacion_id)
    if not db_ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    
    return db_ubicacion
