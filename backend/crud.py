from sqlalchemy.orm import Session
from backend import models, schemas
from passlib.context import CryptContext
from typing import List

# Configuración de password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    """Obtiene un usuario por su correo electrónico."""
    return db.query(models.User).filter(models.User.correo == email).first()

def get_user_by_id(db: Session, user_id: int):
    """Obtiene un usuario por su ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    """Crea un nuevo usuario en la base de datos."""
    db_user = models.User(
        nombre=user.nombre,
        correo=user.correo,
        contrasena_hash=hashed_password,
        rol=user.rol
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Funciones para Auditorías ---
def create_audit(db: Session, audit_data: schemas.AuditCreate, auditor_id: int):
    """Crea una nueva auditoría y sus productos asociados."""
    db_audit = models.Audit(
        auditor_id=auditor_id,
        ubicacion_destino=audit_data.ubicacion_destino,
        estado="en_progreso"
    )
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)

    for product_data in audit_data.productos:
        db_product = models.Product(**product_data.model_dump(), auditoria_id=db_audit.id)
        db.add(db_product)
    
    db.commit()
    db.refresh(db_audit)
    return db_audit

def get_audits(db: Session) -> List[models.Audit]:
    """Obtiene todas las auditorías."""
    return db.query(models.Audit).all()

def get_audit_by_id(db: Session, audit_id: int):
    """Obtiene una auditoría por su ID, incluyendo sus productos."""
    return db.query(models.Audit).filter(models.Audit.id == audit_id).first()

def create_file(db: Session, audit_id: int, file_name: str, file_path: str):
    """Crea un nuevo registro de archivo asociado a una auditoría."""
    db_file = models.File(
        auditoria_id=audit_id,
        nombre_archivo=file_name,
        ruta_archivo=file_path
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file 

def get_audits_by_auditor(db: Session, auditor_id: int):
    """Obtiene todas las auditorías creadas por un auditor específico."""
    return db.query(models.Audit).filter(models.Audit.auditor_id == auditor_id).all()

def get_products_by_audit(db: Session, audit_id: int):
    """Obtiene todos los productos de una auditoría."""
    return db.query(models.Product).filter(models.Product.auditoria_id == audit_id).all()

def update_product(db: Session, product_id: int, product_data: dict):
    """Actualiza un producto auditado."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return None
    for key, value in product_data.items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def finish_audit(db: Session, audit_id: int):
    """Marca una auditoría como finalizada."""
    db_audit = db.query(models.Audit).filter(models.Audit.id == audit_id).first()
    if not db_audit:
        return None
    db_audit.estado = "finalizada"
    db.commit()
    db.refresh(db_audit)
    return db_audit
