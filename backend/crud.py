from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from backend import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime

# Configuración de password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    """Obtiene un usuario por su correo electrónico."""
    return db.query(models.User).filter(models.User.correo == email).first()

def get_user_by_id(db: Session, user_id: int):
    """Obtiene un usuario por su ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario en la base de datos."""
    hashed_password = pwd_context.hash(user.contrasena)
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

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Actualiza un usuario existente."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)
    
    if "contrasena" in update_data and update_data["contrasena"]:
        hashed_password = pwd_context.hash(update_data["contrasena"])
        db_user.contrasena_hash = hashed_password
        del update_data["contrasena"]

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """Elimina un usuario."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user

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
    return db.query(models.Audit).filter(models.Audit.auditor_id.isnot(None)).all()

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
    return db.query(models.Audit).options(joinedload(models.Audit.auditor)).filter(
        models.Audit.auditor_id.isnot(None),
        (
            (models.Audit.auditor_id == auditor_id) |
            (models.Audit.collaborators.any(models.User.id == auditor_id))
        )
    ).all()

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

def recalculate_and_update_audit_percentage(db: Session, audit_id: int) -> Optional[models.Audit]:
    """Recalcula y actualiza el porcentaje de cumplimiento de una auditoría."""
    db_audit = get_audit_by_id(db, audit_id)
    if not db_audit:
        return None

    products = get_products_by_audit(db, audit_id=audit_id)
    
    # Contar solo los productos que han sido auditados (cantidad_fisica no es None)
    productos_auditados = [p for p in products if p.cantidad_fisica is not None]
    total_auditados = len(productos_auditados)

    if total_auditados > 0:
        # El cumplimiento se basa en los productos auditados
        correctos = sum(1 for p in productos_auditados if p.cantidad_fisica == p.cantidad_enviada and p.novedad == 'sin_novedad')
        cumplimiento = round((correctos / total_auditados) * 100)
    else:
        # Si no se ha auditado ningún producto, el cumplimiento es 0
        cumplimiento = 0
    
    db_audit.porcentaje_cumplimiento = cumplimiento
    db.commit()
    db.refresh(db_audit)
    return db_audit


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

def get_audits_with_filters(db: Session, status: Optional[str] = None, auditor_id: Optional[int] = None, date: Optional[str] = None) -> List[models.Audit]:
    """
    Obtiene todas las auditorías con filtros opcionales.
    """
    query = db.query(models.Audit).options(joinedload(models.Audit.auditor), joinedload(models.Audit.productos)).filter(models.Audit.auditor_id.isnot(None))

    if status and status != "Todos":
        query = query.filter(models.Audit.estado == status)
    
    if auditor_id:
        query = query.filter(models.Audit.auditor_id == auditor_id)

    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(models.Audit.creada_en) == filter_date)
        except ValueError:
            pass # Ignore invalid date format

    return query.all()

def get_audits_for_today(db: Session) -> List[models.Audit]:
    """
    Obtiene todas las auditorías creadas en el día actual para el dashboard del admin.
    No se carga la lista de productos para mayor eficiencia.
    """
    today = datetime.now().date()
    return db.query(models.Audit).options(joinedload(models.Audit.auditor)).filter(
        models.Audit.auditor_id.isnot(None),
        func.date(models.Audit.creada_en) == today
    ).all()