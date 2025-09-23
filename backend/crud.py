from sqlalchemy.orm import Session, joinedload
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

def get_users(db: Session) -> List[models.User]:
    """Obtiene todos los usuarios."""
    return db.query(models.User).all()

def get_auditors(db: Session) -> List[models.User]:
    """Devuelve todos los usuarios con rol 'auditor'."""
    return db.query(models.User).filter(models.User.rol == "auditor").all()

# --- Funciones para Auditorías ---
def create_audit(db: Session, audit_data: schemas.AuditCreate, auditor_id: int):
    """Crea una nueva auditoría y sus productos asociados."""
    db_audit = models.Audit(
        auditor_id=auditor_id,
        ubicacion_destino=audit_data.ubicacion_destino,
        estado="pendiente"  # Estado inicial correcto
    )

    # Crear los productos en memoria y asignarlos a la relación.
    # SQLAlchemy se encargará de la cascada y de asignar el `auditoria_id`.
    new_products = [
        models.Product(**product_data.dict())
        for product_data in audit_data.productos
    ]
    db_audit.productos = new_products

    # Añadir el objeto principal a la sesión. Los productos se añadirán
    # automáticamente gracias a la relación y la configuración de cascada.
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

def get_audits(db: Session) -> List[models.Audit]:
    """Obtiene todas las auditorías."""
    return db.query(models.Audit).all()

def get_audit_by_id(db: Session, audit_id: int):
    """Obtiene una auditoría por su ID, incluyendo sus productos."""
    return db.query(models.Audit).options(joinedload(models.Audit.productos)).filter(models.Audit.id == audit_id).first()

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
    """Obtiene todas las auditorías donde el usuario es propietario O colaborador."""
    owned_audits = db.query(models.Audit).filter(models.Audit.auditor_id == auditor_id)
    
    collaborative_audits = db.query(models.Audit).join(
        models.audit_collaborators
    ).filter(models.audit_collaborators.c.user_id == auditor_id)
    
    # Unir los dos queries y eliminar duplicados si los hubiera
    return owned_audits.union(collaborative_audits).all()

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

def add_collaborators_to_audit(db: Session, audit_id: int, collaborator_ids: List[int]):
    """Añade usuarios colaboradores a una auditoría existente."""
    db_audit = get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        return None

    # Limpiar colaboradores existentes si es necesario (o simplemente añadir)
    # db_audit.collaborators.clear()

    for user_id in collaborator_ids:
        user = get_user_by_id(db, user_id=user_id)
        if user and user not in db_audit.collaborators:
            db_audit.collaborators.append(user)
    
    db.commit()
    db.refresh(db_audit)
    return db_audit
