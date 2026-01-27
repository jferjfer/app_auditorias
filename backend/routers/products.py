from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user
from backend import models

router = APIRouter(
    prefix="/products",
    tags=["Productos"],
)

@router.get("/search-description/{sku}")
def search_product_description(
    sku: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Busca la descripción de un SKU en toda la BD."""
    description = crud.get_product_description_by_sku(db, sku)
    return {"sku": sku, "nombre_articulo": description or "NO REFERENCIADO"}

@router.get("/resolve-sku/{sku}")
def resolve_sku_with_mapping(
    sku: str,
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Resuelve un SKU buscando primero directamente y luego en mapeo.
    
    1. Busca SKU directamente en productos de la auditoría
    2. Si no encuentra, busca en tabla sku_mapping
    3. Si encuentra mapeo, busca con SKU nuevo
    
    Retorna: {product, mapped: true/false, sku_antiguo}
    """
    sku_normalizado = sku.upper().strip().lstrip('0') or '0'
    
    # Obtener productos de la auditoría
    productos = crud.get_products_by_audit(db, audit_id)
    
    # PASO 1: Buscar directamente
    producto = None
    for p in productos:
        p_sku_norm = p.sku.upper().strip().lstrip('0') or '0'
        if p_sku_norm == sku_normalizado:
            producto = p
            break
    
    if producto:
        return {
            "product": schemas.Product.from_orm(producto),
            "mapped": False,
            "sku_antiguo": None
        }
    
    # PASO 2: Buscar en mapeo
    mapeo = crud.get_sku_mapping(db, sku_normalizado)
    
    if not mapeo:
        raise HTTPException(status_code=404, detail="SKU no encontrado")
    
    # PASO 3: Buscar con SKU nuevo
    sku_nuevo_norm = mapeo.sku_nuevo.upper().strip().lstrip('0') or '0'
    for p in productos:
        p_sku_norm = p.sku.upper().strip().lstrip('0') or '0'
        if p_sku_norm == sku_nuevo_norm:
            producto = p
            break
    
    if not producto:
        raise HTTPException(
            status_code=404,
            detail=f"SKU mapeado '{mapeo.sku_nuevo}' no encontrado en auditoría"
        )
    
    return {
        "product": schemas.Product.from_orm(producto),
        "mapped": True,
        "sku_antiguo": sku_normalizado,
        "sku_nuevo": mapeo.sku_nuevo
    }
