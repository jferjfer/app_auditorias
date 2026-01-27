import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas, crud
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user
from backend.utils.validators import validate_excel_file

router = APIRouter(
    prefix="/sku-mappings",
    tags=["Mapeo de SKUs"],
)

@router.post("/upload-excel", response_model=schemas.SkuMappingUploadResponse)
async def upload_sku_mappings(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Carga masiva de mapeos de SKU desde Excel.
    Solo administradores pueden usar este endpoint.
    
    Excel debe tener columnas: "SKU ANTIGUO", "SKU NUEVO"
    """
    # Verificar que sea administrador
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden cargar mapeos de SKU"
        )
    
    # Validar archivo
    content = await file.read()
    validate_excel_file(file, content)
    
    # Guardar temporalmente
    temp_file_path = f"temp_sku_mapping_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)
        
        # Leer Excel
        df = pd.read_excel(temp_file_path, engine='openpyxl')
        
        # Normalizar nombres de columnas
        df.columns = df.columns.str.strip().str.upper()
        
        # Verificar columnas requeridas
        required_cols = ["SKU ANTIGUO", "SKU NUEVO"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Faltan columnas requeridas: {', '.join(missing_cols)}"
            )
        
        # Preparar datos
        mappings_data = []
        for _, row in df.iterrows():
            sku_antiguo = str(row.get("SKU ANTIGUO", "")).strip()
            sku_nuevo = str(row.get("SKU NUEVO", "")).strip()
            
            if sku_antiguo and sku_nuevo and sku_antiguo.lower() != 'nan' and sku_nuevo.lower() != 'nan':
                mappings_data.append({
                    "sku_antiguo": sku_antiguo,
                    "sku_nuevo": sku_nuevo
                })
        
        if not mappings_data:
            raise HTTPException(
                status_code=400,
                detail="No se encontraron datos válidos en el archivo"
            )
        
        # Crear mapeos en BD
        result = crud.bulk_create_sku_mappings(db, mappings_data, current_user.id)
        
        return schemas.SkuMappingUploadResponse(
            message=f"Procesados {len(mappings_data)} mapeos",
            creados=result["creados"],
            actualizados=result["actualizados"],
            errores=result["errores"],
            detalles_errores=result["detalles_errores"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")
    finally:
        import os
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/", response_model=List[schemas.SkuMapping])
def get_all_mappings(
    activo_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lista todos los mapeos de SKU.
    Solo administradores pueden ver todos los mapeos.
    """
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver mapeos"
        )
    
    mappings = crud.get_all_sku_mappings(db, activo_only=activo_only)
    return [schemas.SkuMapping.from_orm(m) for m in mappings]

@router.get("/active", response_model=dict)
def get_active_mappings_cache(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene mapeos activos en formato de diccionario para cache.
    Todos los usuarios pueden acceder (para cache en frontend).
    
    Retorna: {sku_antiguo: sku_nuevo}
    """
    mappings = crud.get_all_sku_mappings(db, activo_only=True)
    return {m.sku_antiguo: m.sku_nuevo for m in mappings}

@router.delete("/{mapping_id}")
def delete_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina un mapeo de SKU.
    Solo administradores.
    """
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar mapeos"
        )
    
    success = crud.delete_sku_mapping(db, mapping_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mapeo no encontrado")
    
    return {"message": "Mapeo eliminado exitosamente"}

@router.put("/{mapping_id}/toggle")
def toggle_mapping(
    mapping_id: int,
    activo: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Activa o desactiva un mapeo de SKU.
    Solo administradores.
    """
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden modificar mapeos"
        )
    
    mapping = crud.toggle_sku_mapping(db, mapping_id, activo)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapeo no encontrado")
    
    estado = "activado" if activo else "desactivado"
    return {"message": f"Mapeo {estado} exitosamente", "mapping": schemas.SkuMapping.from_orm(mapping)}
