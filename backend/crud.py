from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, cast, Date
from backend import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
import math

# Configuración de hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    """Obtiene un usuario por su correo electrónico."""
    return db.query(models.User).filter(models.User.correo == email).first()

def get_user_by_id(db: Session, user_id: int):
    """Obtiene un usuario por su ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario en la base de datos."""
    # Validar longitud de contraseña (solo para nuevos usuarios)
    if user.contrasena and len(user.contrasena) < 8:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    
    # Sanitizar entradas
    nombre = user.nombre.strip()[:100] if user.nombre else ""
    correo = user.correo.strip().lower()[:255] if user.correo else ""
    
    hashed_password = pwd_context.hash(user.contrasena)
    db_user = models.User(
        nombre=nombre,
        correo=correo,
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
    """Elimina un usuario. Las auditorías asociadas quedan con auditor_id=NULL para mantener trazabilidad."""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    # Verificar si es el único administrador
    if db_user.rol == "administrador":
        admin_count = db.query(models.User).filter(models.User.rol == "administrador").count()
        if admin_count <= 1:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="No se puede eliminar el único administrador")
    
    # Limpiar referencias antes de eliminar
    # 1. Auditorías como auditor principal -> NULL
    db.query(models.Audit).filter(models.Audit.auditor_id == user_id).update({"auditor_id": None})
    
    # 2. Colaboraciones -> eliminar de tabla many-to-many
    from sqlalchemy import text
    db.execute(text("DELETE FROM audit_collaborators WHERE user_id = :user_id"), {"user_id": user_id})
    
    # 3. Productos bloqueados -> desbloquear
    db.query(models.Product).filter(models.Product.locked_by_user_id == user_id).update({
        "locked_by_user_id": None,
        "locked_at": None
    })
    
    # 4. Historial y novedades se mantienen para trazabilidad (no se eliminan)
    
    db.delete(db_user)
    db.commit()
    return db_user

# --- Funciones para Auditorías ---
def create_audit(db: Session, audit_data: schemas.AuditCreate, auditor_id: int):
    """Crea una nueva auditoría y sus productos asociados."""
    # Mantener marcas de tiempo de la base de datos en UTC (models.Audit.creada_en usa datetime.utcnow por defecto)
    db_audit = models.Audit(
        auditor_id=auditor_id,
        ubicacion_origen_id=audit_data.ubicacion_origen_id,
        ubicacion_destino_id=audit_data.ubicacion_destino_id,
        estado="pendiente"
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

def get_audits(db: Session, limit: int = 100, offset: int = 0) -> List[models.Audit]:
    """
    Obtiene todas las auditorías creadas en el día actual con paginación.
    No se carga la lista de productos para mayor eficiencia.
    """
    bogota_tz = ZoneInfo("America/Bogota")
    bogota_today = datetime.now(bogota_tz).date()
    start_local = datetime.combine(bogota_today, time.min).replace(tzinfo=bogota_tz)
    end_local = datetime.combine(bogota_today, time.max).replace(tzinfo=bogota_tz)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)
    return db.query(models.Audit).options(
        joinedload(models.Audit.auditor),
        joinedload(models.Audit.ubicacion_origen),
        joinedload(models.Audit.ubicacion_destino)
    ).filter(
        models.Audit.auditor_id.isnot(None),
        models.Audit.creada_en >= start_utc,
        models.Audit.creada_en <= end_utc
    ).limit(limit).offset(offset).all()

def get_audit_by_id(db: Session, audit_id: int):
    """Obtiene una auditoría por su ID, incluyendo sus productos y colaboradores."""
    return db.query(models.Audit).options(
        selectinload(models.Audit.productos).selectinload(models.Product.novelties),
        selectinload(models.Audit.collaborators),
        joinedload(models.Audit.ubicacion_origen),
        joinedload(models.Audit.ubicacion_destino)
    ).filter(models.Audit.id == audit_id).first()

def create_file(db: Session, audit_id: int, file_name: str, file_path: str):
    """Crea un nuevo registro de archivo asociado a una auditoría."""
    # Keep database timestamps in UTC (models.File.subido_en default uses datetime.utcnow)
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
    """Obtiene las últimas 6 auditorías donde el usuario es propietario O colaborador."""
    return db.query(models.Audit).options(
        joinedload(models.Audit.auditor),
        joinedload(models.Audit.ubicacion_origen),
        joinedload(models.Audit.ubicacion_destino)
    ).filter(
        models.Audit.auditor_id.isnot(None),
        (
            (models.Audit.auditor_id == auditor_id) |
            (models.Audit.collaborators.any(models.User.id == auditor_id))
        )
    ).order_by(models.Audit.creada_en.desc()).limit(6).all()

def get_products_by_audit(db: Session, audit_id: int):
    """Obtiene todos los productos de una auditoría."""
    return db.query(models.Product).filter(models.Product.auditoria_id == audit_id).all()

def update_product(db: Session, product_id: int, product_data: dict):
    """Actualiza un producto auditado."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return None
    for key, value in product_data.items():
        if key != 'novelties':
            setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def create_product_novelties(db: Session, product_id: int, novelties: list, user_id: int):
    """Crea múltiples novedades para un producto."""
    print(f"🔍 Guardando novedades para producto {product_id}")
    print(f"   Usuario: {user_id}")
    print(f"   Novedades recibidas: {novelties}")
    
    try:
        # Obtener producto para calcular faltante/sobrante
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not db_product:
            return False
        
        # Eliminar novedades anteriores
        deleted = db.query(models.ProductNovelty).filter(
            models.ProductNovelty.product_id == product_id
        ).delete()
        print(f"   🗑️ Eliminadas {deleted} novedades anteriores")
        
        # Crear nuevas novedades
        created_count = 0
        for novelty_data in novelties:
            cantidad = novelty_data.get('cantidad', 0)
            if cantidad > 0:
                # Validar que novedad_tipo sea válido
                try:
                    novedad_tipo = models.NovedadEnum(novelty_data['novedad_tipo'])
                except (ValueError, KeyError) as e:
                    print(f"   ⚠️ Novedad inválida: {novelty_data.get('novedad_tipo', 'N/A')} - {e}")
                    continue
                
                db_novelty = models.ProductNovelty(
                    product_id=product_id,
                    novedad_tipo=novedad_tipo,
                    cantidad=cantidad,
                    observaciones=novelty_data.get('observaciones'),
                    user_id=user_id
                )
                db.add(db_novelty)
                created_count += 1
        
        # Agregar faltante/sobrante automáticamente si aplica
        if db_product.cantidad_fisica is not None and db_product.cantidad_documento is not None:
            diferencia = db_product.cantidad_fisica - db_product.cantidad_documento
            
            if diferencia < 0:  # Faltante
                db_novelty = models.ProductNovelty(
                    product_id=product_id,
                    novedad_tipo=models.NovedadEnum.faltante,
                    cantidad=abs(diferencia),
                    observaciones=f"Faltante de {abs(diferencia)} unidades",
                    user_id=user_id
                )
                db.add(db_novelty)
                created_count += 1
                print(f"   📉 Agregado faltante: {abs(diferencia)} unidades")
            elif diferencia > 0:  # Sobrante
                db_novelty = models.ProductNovelty(
                    product_id=product_id,
                    novedad_tipo=models.NovedadEnum.sobrante,
                    cantidad=diferencia,
                    observaciones=f"Sobrante de {diferencia} unidades",
                    user_id=user_id
                )
                db.add(db_novelty)
                created_count += 1
                print(f"   📈 Agregado sobrante: {diferencia} unidades")
        
        db.commit()
        print(f"   ✅ Creadas {created_count} novedades nuevas")
        return True
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error guardando novedades: {e}")
        raise

def get_product_novelties(db: Session, product_id: int):
    """Obtiene todas las novedades de un producto."""
    return db.query(models.ProductNovelty).filter(models.ProductNovelty.product_id == product_id).all()

def get_novelties_by_audit(db: Session, audit_id: int):
    """
    Obtiene todas las novedades de una auditoría agrupadas por SKU,
    leyendo desde la tabla 'product_novelties'.
    """
    # Consultar todas las novedades para la auditoría, uniendo con el producto para obtener sus detalles.
    novelties_query = db.query(models.ProductNovelty).join(models.Product).filter(
        models.Product.auditoria_id == audit_id
    ).options(joinedload(models.ProductNovelty.product)).all()

    sku_novelties = {}
    for novelty in novelties_query:
        product = novelty.product
        if product.sku not in sku_novelties:
            sku_novelties[product.sku] = {
                'sku': product.sku,
                'nombre_articulo': product.nombre_articulo,
                'cantidad_documento': product.cantidad_documento,
                'novelties': []
            }
        
        # Añadir la novedad real desde la tabla correcta
        sku_novelties[product.sku]['novelties'].append({
            'tipo': novelty.novedad_tipo.value,
            'cantidad': novelty.cantidad,
            'observaciones': novelty.observaciones
        })
            
    return list(sku_novelties.values())

def recalculate_and_update_audit_percentage(db: Session, audit_id: int) -> Optional[models.Audit]:
    """
    Calcula el porcentaje de SKUs únicos auditados.
    Un SKU está auditado si al menos UNA de sus líneas tiene cantidad_fisica registrada (no NULL).
    """
    db_audit = get_audit_by_id(db, audit_id)
    if not db_audit:
        return None

    products = get_products_by_audit(db, audit_id=audit_id)
    
    print(f"📊 Recalculando cumplimiento para auditoría {audit_id}")
    print(f"   Total productos (líneas): {len(products)}")
    
    if len(products) == 0:
        cumplimiento = 100
        print(f"   ✅ Sin productos, cumplimiento: 100%")
    else:
        # Obtener SKUs únicos
        skus_unicos = set(p.sku for p in products)
        
        # Obtener SKUs que tienen al menos una línea auditada
        skus_auditados = set(p.sku for p in products if p.cantidad_fisica is not None)
        
        total_skus = len(skus_unicos)
        skus_con_auditoria = len(skus_auditados)
        
        # Calcular porcentaje exacto sin redondeos
        cumplimiento = int((skus_con_auditoria / total_skus) * 100)
        
        print(f"   📦 SKUs únicos: {total_skus}")
        print(f"   ✅ SKUs auditados: {skus_con_auditoria}")
        print(f"   ✅ Cumplimiento: {cumplimiento}%")

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

    # Optimizado: Una sola query para obtener todos los usuarios
    users = db.query(models.User).filter(models.User.id.in_(collaborator_ids)).all()
    
    # Obtener IDs de colaboradores existentes para evitar duplicados
    existing_ids = {collab.id for collab in db_audit.collaborators}
    
    for user in users:
        if user.id not in existing_ids:
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

def get_audits_with_filters(db: Session, status: Optional[str] = None, auditor_id: Optional[int] = None, ubicacion_origen_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[models.Audit]:
    """
    Obtiene todas las auditorías con filtros opcionales, incluyendo rango de fechas y ubicación origen.
    """
    print(f"🔍 CRUD get_audits_with_filters llamado con:")
    print(f"  status: {repr(status)}")
    print(f"  auditor_id: {repr(auditor_id)}")
    print(f"  ubicacion_origen_id: {repr(ubicacion_origen_id)}")
    print(f"  start_date: {repr(start_date)}")
    print(f"  end_date: {repr(end_date)}")
    
    query = db.query(models.Audit).options(joinedload(models.Audit.auditor), joinedload(models.Audit.productos)).filter(models.Audit.auditor_id.isnot(None))

    if status and status != "Todos":
        query = query.filter(models.Audit.estado == status)
    
    if auditor_id:
        query = query.filter(models.Audit.auditor_id == auditor_id)
    
    if ubicacion_origen_id:
        query = query.filter(models.Audit.ubicacion_origen_id == ubicacion_origen_id)

    # Interpretar las fechas proporcionadas como fechas locales en America/Bogota y convertir a rango UTC
    bogota_tz = ZoneInfo("America/Bogota")
    if start_date and start_date.strip():
        try:
            print(f"📅 Parseando start_date: {repr(start_date)}")
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
            start_local = datetime.combine(sd, time.min).replace(tzinfo=bogota_tz)
            start_utc = start_local.astimezone(timezone.utc)
            query = query.filter(models.Audit.creada_en >= start_utc)
            print(f"✅ start_date parseado correctamente: {sd}")
        except (ValueError, Exception) as e:
            print(f"❌ Error parseando start_date: {e}")
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail=f"Fecha de inicio inválida: {start_date} - Error: {str(e)}")

    if end_date and end_date.strip():
        try:
            print(f"📅 Parseando end_date: {repr(end_date)}")
            ed = datetime.strptime(end_date, "%Y-%m-%d").date()
            end_local = datetime.combine(ed, time.max).replace(tzinfo=bogota_tz)
            end_utc = end_local.astimezone(timezone.utc)
            query = query.filter(models.Audit.creada_en <= end_utc)
            print(f"✅ end_date parseado correctamente: {ed}")
        except (ValueError, Exception) as e:
            print(f"❌ Error parseando end_date: {e}")
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail=f"Fecha de fin inválida: {end_date} - Error: {str(e)}")

    return query.all()

def get_audits_for_today(db: Session) -> List[models.Audit]:
    """
    Obtiene todas las auditorías creadas en el día actual para el dashboard del admin.
    No se carga la lista de productos para mayor eficiencia.
    """
    # Mismo comportamiento que get_audits: usar día local de Bogotá convertido a rango UTC
    bogota_tz = ZoneInfo("America/Bogota")
    bogota_today = datetime.now(bogota_tz).date()
    start_local = datetime.combine(bogota_today, time.min).replace(tzinfo=bogota_tz)
    end_local = datetime.combine(bogota_today, time.max).replace(tzinfo=bogota_tz)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)
    return db.query(models.Audit).options(joinedload(models.Audit.auditor)).filter(
        models.Audit.auditor_id.isnot(None),
        models.Audit.creada_en >= start_utc,
        models.Audit.creada_en <= end_utc
    ).all()


def get_audit_statistics_by_status(db: Session):
    """Obtiene el recuento de auditorías por estado.
    Ahora soporta filtros opcionales (status, auditor_id, start_date, end_date) aplicados a la tabla de auditorías.
    """
    # Aplicar límite de 30 días por defecto
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    return db.query(
        models.Audit.estado,
        func.count(models.Audit.id)
    ).filter(
        models.Audit.creada_en >= start_utc
    ).group_by(models.Audit.estado).all()


def get_average_compliance(db: Session):
    """Obtiene el porcentaje de cumplimiento promedio de auditorías finalizadas de los últimos 30 días."""
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    result = db.query(func.avg(models.Audit.porcentaje_cumplimiento)).filter(
        models.Audit.estado == "finalizada",
        models.Audit.creada_en >= start_utc
    ).scalar()
    return round(result) if result else 0


def get_novelty_distribution(db: Session):
    """Obtiene el recuento de cada tipo de novedad de los últimos 30 días, incluyendo product_novelties."""
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    # Contar novedades del campo product.novedad (faltante/sobrante)
    # OPTIMIZADO: Solo contar, no cargar objetos completos
    product_novelties = db.query(
        models.Product.novedad,
        func.count(models.Product.id)
    ).join(models.Audit).filter(
        models.Audit.creada_en >= start_utc,
        models.Audit.auditor_id.isnot(None)
    ).group_by(models.Product.novedad).all()
    
    # Contar novedades de la tabla product_novelties (averías, vencidos, etc.)
    # OPTIMIZADO: Solo contar, no cargar objetos completos
    table_novelties = db.query(
        models.ProductNovelty.novedad_tipo,
        func.count(models.ProductNovelty.id)
    ).join(models.Product).join(models.Audit).filter(
        models.Audit.creada_en >= start_utc,
        models.Audit.auditor_id.isnot(None)
    ).group_by(models.ProductNovelty.novedad_tipo).all()
    
    # Combinar ambos resultados
    combined = {}
    for novedad, count in product_novelties:
        if novedad:  # Ignorar None
            combined[novedad] = combined.get(novedad, 0) + count
    
    for novedad_tipo, count in table_novelties:
        novedad_str = novedad_tipo.value if hasattr(novedad_tipo, 'value') else str(novedad_tipo)
        combined[novedad_str] = combined.get(novedad_str, 0) + count
    
    return [(k, v) for k, v in combined.items()]


def get_compliance_by_auditor(db: Session):
    """Obtiene el cumplimiento promedio por cada auditor de los últimos 30 días."""
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    # OPTIMIZADO: Solo agregaciones, sin cargar objetos
    return (db.query(
        models.User.nombre,
        func.avg(models.Audit.porcentaje_cumplimiento)
    ).join(models.Audit, models.User.id == models.Audit.auditor_id)
    .filter(
        models.Audit.estado == "finalizada",
        models.Audit.creada_en >= start_utc,
        models.Audit.auditor_id.isnot(None),
        models.Audit.porcentaje_cumplimiento.isnot(None)
    )
    .group_by(models.User.nombre).all())


def get_audits_by_period(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Obtiene el número de auditorías creadas por día. Si no se especifican fechas, usa últimos 30 días."""
    bogota_tz = ZoneInfo("America/Bogota")
    query = db.query(models.Audit).filter(models.Audit.auditor_id.isnot(None))
    
    # Si no hay fechas, aplicar límite de 30 días por defecto
    if not start_date and not end_date:
        default_start = datetime.now(bogota_tz) - timedelta(days=30)
        start_utc = default_start.astimezone(timezone.utc)
        query = query.filter(models.Audit.creada_en >= start_utc)
    else:
        # Aplicar fechas proporcionadas
        if start_date:
            try:
                sd = datetime.strptime(start_date, "%Y-%m-%d").date()
                start_local = datetime.combine(sd, time.min).replace(tzinfo=bogota_tz)
                start_utc = start_local.astimezone(timezone.utc)
                query = query.filter(models.Audit.creada_en >= start_utc)
            except ValueError:
                pass
        if end_date:
            try:
                ed = datetime.strptime(end_date, "%Y-%m-%d").date()
                end_local = datetime.combine(ed, time.max).replace(tzinfo=bogota_tz)
                end_utc = end_local.astimezone(timezone.utc)
                query = query.filter(models.Audit.creada_en <= end_utc)
            except ValueError:
                pass

    audits = query.all()
    counter = {}
    for a in audits:
        dt = a.creada_en
        if dt is None:
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        bog_dt = dt.astimezone(bogota_tz).date()
        counter[bog_dt] = counter.get(bog_dt, 0) + 1

    items = sorted(counter.items())
    return items


def get_top_novelty_skus(db: Session, limit: int = 10):
    """Obtiene los N SKUs con más novedades de los últimos 30 días (excluyendo 'sin_novedad')."""
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    # OPTIMIZADO: Solo agregaciones, sin cargar objetos completos
    return (db.query(
        models.Product.sku,
        models.Product.nombre_articulo,
        func.count(models.Product.id).label('total_novedades')
    ).join(models.Audit).filter(
        models.Product.novedad != "sin_novedad",
        models.Product.novedad.isnot(None),
        models.Audit.creada_en >= start_utc,
        models.Audit.auditor_id.isnot(None)
    )
    .group_by(models.Product.sku, models.Product.nombre_articulo)
    .order_by(func.count(models.Product.id).desc())
    .limit(limit).all())


def get_average_audit_duration(db: Session):
    """Obtiene la duración promedio de las auditorías finalizadas de los últimos 30 días en horas."""
    bogota_tz = ZoneInfo("America/Bogota")
    default_start = datetime.now(bogota_tz) - timedelta(days=30)
    start_utc = default_start.astimezone(timezone.utc)
    
    result = db.query(
        func.avg(func.extract('epoch', models.Audit.finalizada_en - models.Audit.creada_en)) / 3600
    ).filter(
        models.Audit.estado == "finalizada",
        models.Audit.finalizada_en.isnot(None),
        models.Audit.creada_en >= start_utc
    ).scalar()
    return round(result, 2) if result else 0.0

def get_product_with_novelties(db: Session, product_id: int):
    """Obtiene un producto con todas sus novedades."""
    from sqlalchemy.orm import joinedload
    return db.query(models.Product).options(
        joinedload(models.Product.novelties)
    ).filter(models.Product.id == product_id).first()

def get_product_description_by_sku(db: Session, sku: str):
    """Busca la descripción de un SKU en toda la base de datos."""
    product = db.query(models.Product).filter(
        models.Product.sku == sku,
        models.Product.nombre_articulo != 'NO REFERENCIADO'
    ).first()
    return product.nombre_articulo if product else None

def search_audits_by_ot(db: Session, auditor_id: int, ot_query: str):
    """Busca EXACTAMENTE una auditoría que contenga la OT especificada."""
    return db.query(models.Audit).options(joinedload(models.Audit.auditor)).filter(
        models.Audit.auditor_id.isnot(None),
        (
            (models.Audit.auditor_id == auditor_id) |
            (models.Audit.collaborators.any(models.User.id == auditor_id))
        )
    ).order_by(models.Audit.creada_en.desc()).limit(1).all()

# --- Funciones para Ubicaciones ---
def create_ubicacion(db: Session, ubicacion: schemas.UbicacionCreate, user_id: int):
    """Crea una nueva sede."""
    db_ubicacion = models.Ubicacion(
        nombre=ubicacion.nombre.strip(),
        tipo='sede',
        creado_por=user_id
    )
    db.add(db_ubicacion)
    db.commit()
    db.refresh(db_ubicacion)
    return db_ubicacion

def get_ubicaciones(db: Session, tipo: Optional[str] = None) -> List[models.Ubicacion]:
    """Obtiene todas las sedes."""
    return db.query(models.Ubicacion).order_by(models.Ubicacion.nombre).all()

def delete_ubicacion(db: Session, ubicacion_id: int):
    """Elimina una ubicación solo si no está siendo usada por auditorías."""
    db_ubicacion = db.query(models.Ubicacion).filter(models.Ubicacion.id == ubicacion_id).first()
    if not db_ubicacion:
        return None
    
    # Verificar si está en uso
    audits_using = db.query(models.Audit).filter(
        (models.Audit.ubicacion_origen_id == ubicacion_id) |
        (models.Audit.ubicacion_destino_id == ubicacion_id)
    ).count()
    
    if audits_using > 0:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar. {audits_using} auditoría(s) usan esta ubicación"
        )
    
    db.delete(db_ubicacion)
    db.commit()
    return db_ubicacion


# --- Funciones para Mapeo de SKUs ---
def get_sku_mapping(db: Session, sku_antiguo: str) -> Optional[models.SkuMapping]:
    """Busca un mapeo de SKU antiguo a nuevo."""
    return db.query(models.SkuMapping).filter(
        models.SkuMapping.sku_antiguo == sku_antiguo.upper().strip(),
        models.SkuMapping.activo == True
    ).first()

def get_all_sku_mappings(db: Session, activo_only: bool = True) -> List[models.SkuMapping]:
    """Obtiene todos los mapeos de SKU."""
    query = db.query(models.SkuMapping)
    if activo_only:
        query = query.filter(models.SkuMapping.activo == True)
    return query.order_by(models.SkuMapping.fecha_creacion.desc()).all()

def create_sku_mapping(db: Session, sku_antiguo: str, sku_nuevo: str, user_id: int) -> models.SkuMapping:
    """Crea un nuevo mapeo de SKU."""
    sku_antiguo = sku_antiguo.upper().strip()
    sku_nuevo = sku_nuevo.upper().strip()
    
    # Verificar si ya existe
    existing = db.query(models.SkuMapping).filter(
        models.SkuMapping.sku_antiguo == sku_antiguo
    ).first()
    
    if existing:
        # Actualizar existente
        existing.sku_nuevo = sku_nuevo
        existing.activo = True
        existing.creado_por = user_id
        existing.fecha_creacion = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Crear nuevo
    mapping = models.SkuMapping(
        sku_antiguo=sku_antiguo,
        sku_nuevo=sku_nuevo,
        creado_por=user_id,
        activo=True
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping

def bulk_create_sku_mappings(db: Session, mappings_data: List[dict], user_id: int) -> dict:
    """Crea múltiples mapeos de SKU desde un Excel."""
    creados = 0
    actualizados = 0
    errores = 0
    detalles_errores = []
    
    for idx, mapping in enumerate(mappings_data, start=2):  # Start at 2 (Excel row number)
        try:
            sku_antiguo = str(mapping.get('sku_antiguo', '')).strip().upper()
            sku_nuevo = str(mapping.get('sku_nuevo', '')).strip().upper()
            
            if not sku_antiguo or not sku_nuevo:
                errores += 1
                detalles_errores.append(f"Fila {idx}: SKUs vacíos")
                continue
            
            # Verificar si existe
            existing = db.query(models.SkuMapping).filter(
                models.SkuMapping.sku_antiguo == sku_antiguo
            ).first()
            
            if existing:
                existing.sku_nuevo = sku_nuevo
                existing.activo = True
                existing.creado_por = user_id
                existing.fecha_creacion = datetime.utcnow()
                actualizados += 1
            else:
                new_mapping = models.SkuMapping(
                    sku_antiguo=sku_antiguo,
                    sku_nuevo=sku_nuevo,
                    creado_por=user_id,
                    activo=True
                )
                db.add(new_mapping)
                creados += 1
                
        except Exception as e:
            errores += 1
            detalles_errores.append(f"Fila {idx}: {str(e)}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error guardando mapeos: {str(e)}")
    
    return {
        "creados": creados,
        "actualizados": actualizados,
        "errores": errores,
        "detalles_errores": detalles_errores[:10]  # Limitar a 10 errores
    }

def delete_sku_mapping(db: Session, mapping_id: int) -> bool:
    """Elimina un mapeo de SKU."""
    mapping = db.query(models.SkuMapping).filter(models.SkuMapping.id == mapping_id).first()
    if not mapping:
        return False
    db.delete(mapping)
    db.commit()
    return True

def toggle_sku_mapping(db: Session, mapping_id: int, activo: bool) -> Optional[models.SkuMapping]:
    """Activa o desactiva un mapeo de SKU."""
    mapping = db.query(models.SkuMapping).filter(models.SkuMapping.id == mapping_id).first()
    if not mapping:
        return None
    mapping.activo = activo
    db.commit()
    db.refresh(mapping)
    return mapping
