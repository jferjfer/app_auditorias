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
    """Obtiene una auditoría por su ID, incluyendo sus productos y colaboradores."""
    return db.query(models.Audit).options(
        joinedload(models.Audit.productos),
        joinedload(models.Audit.collaborators)
    ).filter(models.Audit.id == audit_id).first()

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
    """
    Recalcula y actualiza el porcentaje de cumplimiento de una auditoría basándose en las unidades de producto.
    El cumplimiento se calcula como: (SUMA(min(fisico, documento)) / SUMA(documento)) * 100
    """
    db_audit = get_audit_by_id(db, audit_id)
    if not db_audit:
        return None

    products = get_products_by_audit(db, audit_id=audit_id)
    
    total_documento_unidades = sum(p.cantidad_documento for p in products if p.cantidad_documento is not None)
    
    if total_documento_unidades == 0:
        cumplimiento = 100 # Si no se esperan productos, el cumplimiento es del 100%
    else:
        unidades_cumplidas = 0
        for p in products:
            if p.cantidad_fisica is not None and p.cantidad_documento is not None:
                unidades_cumplidas += min(p.cantidad_fisica, p.cantidad_documento)
        
        cumplimiento = round((unidades_cumplidas / total_documento_unidades) * 100)

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

def create_surplus_product(db: Session, audit_id: int, product_data: schemas.SurplusProductCreate) -> Optional[models.Product]:
    """Crea un nuevo producto 'sobrante' y lo asocia a una auditoría existente."""
    db_audit = get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        return None

    # Intentar obtener una orden de traslado de otro producto en la misma auditoría
    orden_traslado = "SOBRANTE"
    if db_audit.productos:
        orden_traslado = db_audit.productos[0].orden_traslado_original

    new_product = models.Product(
        auditoria_id=audit_id,
        sku=product_data.sku,
        nombre_articulo="SOBRANTE NO REGISTRADO",
        cantidad_documento=0,
        cantidad_enviada=0,
        cantidad_fisica=product_data.cantidad_fisica,
        novedad="sobrante",
        observaciones=product_data.observaciones or "Sobrante registrado por colaborador",
        orden_traslado_original=orden_traslado
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def get_audits_with_filters(db: Session, status: Optional[str] = None, auditor_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[models.Audit]:
    """
    Obtiene todas las auditorías con filtros opcionales, incluyendo rango de fechas.
    """
    query = db.query(models.Audit).options(joinedload(models.Audit.auditor), joinedload(models.Audit.productos)).filter(models.Audit.auditor_id.isnot(None))

    if status and status != "Todos":
        query = query.filter(models.Audit.estado == status)
    
    if auditor_id:
        query = query.filter(models.Audit.auditor_id == auditor_id)

    if start_date:
        try:
            filter_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(func.date(models.Audit.creada_en) >= filter_start_date)
        except ValueError:
            pass # Ignorar formato de fecha inválido

    if end_date:
        try:
            filter_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(func.date(models.Audit.creada_en) <= filter_end_date)
        except ValueError:
            pass # Ignorar formato de fecha inválido

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


def get_audit_statistics_by_status(db: Session):
    """Obtiene el recuento de auditorías por estado."""
    return db.query(
        models.Audit.estado,
        func.count(models.Audit.id)
    ).group_by(models.Audit.estado).all()


def get_average_compliance(db: Session):
    """Obtiene el porcentaje de cumplimiento promedio de todas las auditorías finalizadas."""
    result = db.query(func.avg(models.Audit.porcentaje_cumplimiento)).filter(models.Audit.estado == "finalizada").scalar()
    return round(result) if result else 0


def get_novelty_distribution(db: Session):
    """Obtiene el recuento de cada tipo de novedad en todos los productos."""
    return db.query(
        models.Product.novedad,
        func.count(models.Product.id)
    ).group_by(models.Product.novedad).all()


def get_compliance_by_auditor(db: Session):
    """Obtiene el cumplimiento promedio por cada auditor."""
    return (db.query(
        models.User.nombre,
        func.avg(models.Audit.porcentaje_cumplimiento)
    ).join(models.Audit, models.User.id == models.Audit.auditor_id)
    .filter(models.Audit.estado == "finalizada")
    .group_by(models.User.nombre).all())


def get_audits_by_period(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Obtiene el número de auditorías creadas por día dentro de un período dado."""
    query = db.query(
        func.date(models.Audit.creada_en).label('fecha'),
        func.count(models.Audit.id).label('total_auditorias')
    )

    if start_date:
        filter_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        query = query.filter(func.date(models.Audit.creada_en) >= filter_start_date)
    if end_date:
        filter_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        query = query.filter(func.date(models.Audit.creada_en) <= filter_end_date)

    return query.group_by('fecha').order_by('fecha').all()


def get_top_novelty_skus(db: Session, limit: int = 10):
    """Obtiene los N SKUs con más novedades (excluyendo 'sin_novedad')."""
    return (db.query(
        models.Product.sku,
        models.Product.nombre_articulo,
        func.count(models.Product.id).label('total_novedades')
    ).filter(models.Product.novedad != "sin_novedad")
    .group_by(models.Product.sku, models.Product.nombre_articulo)
    .order_by(func.count(models.Product.id).desc())
    .limit(limit).all())


def get_average_audit_duration(db: Session):
    """Obtiene la duración promedio de las auditorías finalizadas en horas."""
    result = db.query(
        func.avg(func.julianday(models.Audit.finalizada_en) - func.julianday(models.Audit.creada_en)) * 24
    ).filter(models.Audit.estado == "finalizada", models.Audit.finalizada_en.isnot(None)).scalar()
    return round(result, 2) if result else 0.0