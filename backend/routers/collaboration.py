from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import json

from backend import models, schemas
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user
from .websockets import manager

router = APIRouter(prefix="/collaboration", tags=["Colaboración"])

@router.post("/{audit_id}/products/{product_id}/lock")
async def lock_product(audit_id: int, product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.auditoria_id == audit_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if product.locked_by_user_id and product.locked_by_user_id != current_user.id:
        if product.locked_at and datetime.utcnow() - product.locked_at < timedelta(minutes=5):
            raise HTTPException(status_code=409, detail=f"Producto bloqueado por {product.locked_by.nombre}")
    
    product.locked_by_user_id = current_user.id
    product.locked_at = datetime.utcnow()
    db.commit()
    
    await manager.send_to_audit(audit_id, {"type": "product_locked", "product_id": product_id, "user": current_user.nombre})
    return {"message": "Producto bloqueado"}

@router.post("/{audit_id}/products/{product_id}/unlock")
async def unlock_product(audit_id: int, product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.auditoria_id == audit_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.locked_by_user_id = None
    product.locked_at = None
    db.commit()
    
    await manager.send_to_audit(audit_id, {"type": "product_unlocked", "product_id": product_id})
    return {"message": "Producto desbloqueado"}

@router.get("/{audit_id}/history")
def get_audit_history(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Usar LEFT JOIN con condición explícita para incluir productos eliminados
    history = db.query(models.ProductHistory).outerjoin(
        models.Product,
        models.ProductHistory.product_id == models.Product.id
    ).filter(
        (models.Product.auditoria_id == audit_id) | 
        (models.Product.id.is_(None))
    ).order_by(models.ProductHistory.modified_at.desc()).limit(100).all()
    
    return [{
        "id": h.id, 
        "product_id": h.product_id, 
        "user_id": h.user_id, 
        "user_name": h.user.nombre if h.user else "Usuario eliminado", 
        "ot": h.product.orden_traslado_original if h.product else "N/A",
        "sku": h.product.sku if h.product else "N/A",
        "descripcion": h.product.nombre_articulo if h.product else "Producto eliminado",
        "field_changed": h.field_changed, 
        "old_value": h.old_value, 
        "new_value": h.new_value, 
        "modified_at": h.modified_at
    } for h in history]
