from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend import crud
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
