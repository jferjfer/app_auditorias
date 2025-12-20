import os
import shutil
import pandas as pd
import re
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime, timezone
from typing import List, Optional
from fastapi.responses import StreamingResponse
import io
from datetime import date, timedelta, time
from zoneinfo import ZoneInfo

from backend import models, schemas, crud
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user
from backend.utils.validators import validate_excel_file, validate_files_batch, validate_ot_number
from .websockets import manager

router = APIRouter(
    prefix="/audits",
    tags=["Auditorías"],
)

@router.post("/", response_model=schemas.AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(
    audit: schemas.AuditCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Crea una nueva auditoría a partir de un payload JSON.
    """
    db_audit = crud.create_audit(db, audit, auditor_id=current_user.id)
    db.refresh(db_audit)
    audit_response = schemas.AuditResponse.from_orm(db_audit)
    audit_response.productos_count = len(db_audit.productos)
    return audit_response


@router.post("/upload-multiple-files")
async def upload_multiple_audit_files(
    files: List[UploadFile] = File(...),
    ubicacion_origen_id: Optional[int] = None,
    ubicacion_destino_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Carga múltiples archivos de Excel para crear una sola auditoría con todas las OTs.
    """
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"Carga de archivos iniciada por {current_user.correo}")
    
    if current_user.rol != "auditor":
        raise HTTPException(status_code=403, detail="No tienes permiso para cargar archivos.")

    try:
        # Validar lote de archivos
        validate_files_batch(files)
    except Exception as e:
        logger.error(f"Error validando archivos: {e}")
        raise HTTPException(status_code=400, detail=f"Error en validación: {str(e)}")

    all_productos_data = []
    ordenes_procesadas = set()

    for file_index, file in enumerate(files):
        # Leer contenido del archivo
        content = await file.read()
        
        # Validar archivo Excel
        validate_excel_file(file, content)

        temp_file_path = f"temp_{file.filename}_{file_index}"
        try:
            with open(temp_file_path, "wb") as buffer:
                buffer.write(content)

            df = pd.read_excel(temp_file_path, engine='openpyxl', header=None)
            
            header_row = None
            target_patterns = [["número", "documento"], ["sku", "articulo"], ["nombre", "articulo"], ["cantidad"], ["un", "enviada"]]
            for i in range(len(df)):
                row_values = [str(cell).lower().strip() if pd.notna(cell) else "" for cell in df.iloc[i]]
                matches = sum(1 for pattern in target_patterns if any(all(keyword in cell for keyword in pattern) for cell in row_values))
                if matches >= 3:
                    header_row = i
                    break
            
            if header_row is None:
                continue

            df = pd.read_excel(temp_file_path, engine='openpyxl', header=header_row)
            
            exact_mapping = {'Número de documento': 'número de documento', 'SKU ARTICULO': 'sku articulo', 'NOMBRE ARTICULO': 'nombre articulo', 'Cantidad': 'cantidad', 'Un Enviada': 'un enviada'}
            column_mapping = {}
            for original_col in df.columns:
                original_col_str = str(original_col).strip().lower()
                for key, val in exact_mapping.items():
                    if original_col_str == key.lower():
                        column_mapping[original_col] = val
                        break
            df = df.rename(columns=column_mapping)

            required_columns = ["número de documento", "sku articulo", "nombre articulo", "cantidad", "un enviada"]
            if any(col not in df.columns for col in required_columns):
                continue

            df["cantidad"] = pd.to_numeric(df["cantidad"], errors='coerce').fillna(0).astype(int)
            df["un enviada"] = pd.to_numeric(df["un enviada"], errors='coerce').fillna(0).astype(int)

            numero_documento = next((str(df.iloc[i][df.columns[0]]).strip() for i in range(len(df)) if pd.notna(df.iloc[i][df.columns[0]]) and "total" not in str(df.iloc[i][df.columns[0]]).lower()), f"Documento_{file_index}")
            ordenes_procesadas.add(numero_documento)

            for i, row in df.iterrows():
                sku_value = row.get("sku articulo")
                if pd.isna(sku_value) or "total" in str(sku_value).lower():
                    continue
                
                sku = str(sku_value).strip().split('.')[0]
                orden_traslado = str(numero_documento).strip()
                if "VE" in orden_traslado:
                    match = re.search(r'VE\d+', orden_traslado)
                    if match:
                        orden_traslado = match.group(0)

                producto_data = {
                    "sku": sku,
                    "nombre_articulo": str(row.get("nombre articulo", "Sin nombre")).strip(),
                    "cantidad_documento": row.get("un enviada", 0),
                    "cantidad_enviada": row.get("cantidad", 0),
                    "orden_traslado_original": orden_traslado,
                    "novedad": "sin_novedad"
                }
                all_productos_data.append(schemas.ProductBase(**producto_data))

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    if not all_productos_data:
        logger.warning("No se encontraron productos válidos")
        raise HTTPException(status_code=400, detail="No se encontraron productos válidos en los archivos.")

    processed_orders_list = list(ordenes_procesadas)
    num_orders = len(processed_orders_list)
    logger.info(f"Procesados {len(all_productos_data)} productos de {num_orders} OTs")

    try:
        audit_data = schemas.AuditCreate(
            ubicacion_origen_id=ubicacion_origen_id,
            ubicacion_destino_id=ubicacion_destino_id,
            productos=all_productos_data
        )
        db_audit = crud.create_audit(db, audit_data, auditor_id=current_user.id)
        db.refresh(db_audit)
        logger.info(f"Auditoría {db_audit.id} creada exitosamente")
    except Exception as e:
        logger.error(f"Error creando auditoría: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear auditoría: {str(e)}")

    return {
        "message": f"Auditoría creada con {num_orders} orden(es) de traslado.",
        "audit_id": db_audit.id,
        "productos_procesados": len(all_productos_data),
        "ordenes_procesadas": processed_orders_list,
        "numero_ordenes": num_orders
    }

@router.get("/", response_model=List[schemas.AuditResponse])
def get_audits(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol == "auditor":
        audits = crud.get_audits_by_auditor(db, auditor_id=current_user.id)
    else: # For analyst, admin and any other roles
        audits = crud.get_audits(db)
    
    # Poblar auditor_nombre
    result = []
    for audit in audits:
        audit_response = schemas.AuditResponse.from_orm(audit)
        audit_response.auditor_nombre = audit.auditor.nombre if audit.auditor else None
        result.append(audit_response)
    return result

@router.get("/auditor/{auditor_id}", response_model=List[schemas.AuditResponse])
def get_audits_by_auditor(auditor_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.rol != "administrador" and current_user.id != auditor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para ver estas auditorías")
    
    audits = crud.get_audits_by_auditor(db, auditor_id)
    return [schemas.AuditResponse.from_orm(audit) for audit in audits]

@router.get("/search-by-ot/{ot_number}", response_model=schemas.AuditDetails)
def search_audit_by_exact_ot(
    ot_number: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Busca una auditoría que contenga la OT especificada y devuelve SOLO los productos de esa OT.
    """
    # Validar y sanitizar OT
    ot_number = validate_ot_number(ot_number)
    # Construir filtro según el rol
    if current_user.rol in ["analista", "administrador"]:
        # Analistas y admins pueden ver todas las auditorías
        audit = db.query(models.Audit).join(models.Product).options(
            joinedload(models.Audit.auditor),
            joinedload(models.Audit.collaborators)
        ).filter(
            models.Audit.auditor_id.isnot(None),
            models.Product.orden_traslado_original == ot_number
        ).order_by(models.Audit.creada_en.desc()).first()
    else:
        # Auditores solo ven sus auditorías o donde son colaboradores
        audit = db.query(models.Audit).join(models.Product).options(
            joinedload(models.Audit.auditor),
            joinedload(models.Audit.collaborators)
        ).filter(
            models.Audit.auditor_id.isnot(None),
            (
                (models.Audit.auditor_id == current_user.id) |
                (models.Audit.collaborators.any(models.User.id == current_user.id))
            ),
            models.Product.orden_traslado_original == ot_number
        ).order_by(models.Audit.creada_en.desc()).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail=f"No se encontró auditoría con OT {ot_number}")
    
    # Filtrar productos para mostrar SOLO los de esa OT específica
    filtered_products = db.query(models.Product).options(
        joinedload(models.Product.novelties)
    ).filter(
        models.Product.auditoria_id == audit.id,
        models.Product.orden_traslado_original == ot_number
    ).all()
    
    # Crear respuesta con productos filtrados
    audit_dict = {
        'id': audit.id,
        'auditor_id': audit.auditor_id,
        'ubicacion_destino': audit.ubicacion_destino,
        'estado': audit.estado,
        'porcentaje_cumplimiento': audit.porcentaje_cumplimiento,
        'creada_en': audit.creada_en,
        'auditor_nombre': audit.auditor.nombre if audit.auditor else None,
        'productos': filtered_products,
        'collaborators': audit.collaborators,
        'auditor': audit.auditor
    }
    
    return schemas.AuditDetails(**audit_dict)

@router.put("/{audit_id}/iniciar", response_model=schemas.Audit)
async def iniciar_auditoria(audit_id: int, modo: str = "normal", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
    if db_audit.estado != "pendiente":
        raise HTTPException(status_code=400, detail=f"No se puede iniciar una auditoría en estado '{db_audit.estado}'")
    db_audit.estado = "en_progreso"
    db_audit.modo_auditoria = modo
    db.commit()
    db.refresh(db_audit)
    return db_audit

@router.get("/{audit_id}", response_model=schemas.AuditDetails)
def get_audit_details(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators and current_user.rol not in ["analista", "administrador"]):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
    
    # Combinar novedades de ambas tablas para cada producto
    for producto in db_audit.productos:
        novedades = []
        if producto.novedad and producto.novedad != 'sin_novedad':
            novedades.append(producto.novedad)
        
        if hasattr(producto, 'novelties') and producto.novelties:
            for nov in producto.novelties:
                tipo = nov.novedad_tipo.value if hasattr(nov.novedad_tipo, 'value') else str(nov.novedad_tipo)
                if tipo not in novedades:
                    novedades.append(tipo)
        
        producto.novedad = ', '.join(novedades) if novedades else 'sin_novedad'
    
    return schemas.AuditDetails.from_orm(db_audit)

@router.put("/{audit_id}/products/{product_id}", response_model=schemas.ProductUpdateResponse)
async def update_product_endpoint(audit_id: int, product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
        if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators):
            raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
        
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en update_product_endpoint: {e}")
        print(f"audit_id: {audit_id}, product_id: {product_id}, data: {product.dict()}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    
    try:
        # Track changes
        product_dict = product.dict(exclude_unset=True)
        for field, new_value in product_dict.items():
            if field != 'novelties':
                old_value = getattr(db_product, field, None)
                if old_value != new_value:
                    history = models.ProductHistory(
                        product_id=product_id,
                        user_id=current_user.id,
                        field_changed=field,
                        old_value=str(old_value) if old_value else None,
                        new_value=str(new_value) if new_value else None
                    )
                    db.add(history)
        
        # Actualizar producto
        updated_product = crud.update_product(db, product_id, product_dict)
        
        # Crear novedades si se proporcionaron
        if 'novelties' in product_dict and product_dict['novelties']:
            try:
                success = crud.create_product_novelties(
                    db, 
                    product_id, 
                    product_dict['novelties'], 
                    current_user.id
                )
                if not success:
                    print(f"⚠️ Advertencia: No se pudieron guardar todas las novedades para producto {product_id}")
            except Exception as novelty_error:
                print(f"❌ Error guardando novedades: {novelty_error}")
                # No fallar todo el update por error en novedades
        
        updated_product.last_modified_by_id = current_user.id
        updated_product.last_modified_at = datetime.utcnow()
        updated_product.locked_by_user_id = None
        updated_product.locked_at = None
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error actualizando producto: {e}")
        raise HTTPException(status_code=500, detail=f"Error actualizando producto: {str(e)}")

    try:
        # Recalculate percentage and get updated audit
        updated_audit = crud.recalculate_and_update_audit_percentage(db, audit_id)

        # Broadcast product update to the specific audit room
        try:
            product_for_broadcast = schemas.Product.from_orm(updated_product).dict()
            payload = {
                "type": "product_updated",
                "product": product_for_broadcast,
                "user": current_user.nombre
            }
            await manager.send_to_audit(audit_id, payload)
        except Exception as e:
            print(f"Error broadcasting product update for audit {audit_id}: {e}")

        # Audit updated (no broadcast needed)

        return {"message": "Producto actualizado", "product": updated_product}
    except Exception as e:
        print(f"Error en post-update: {e}")
        # Aún así retornar el producto actualizado
        return {"message": "Producto actualizado", "product": updated_product}

@router.post("/{audit_id}/products/bulk-update", response_model=dict)
async def bulk_update_products_endpoint(
    audit_id: int,
    update_request: schemas.ProductBulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")

    updated_products_count = 0
    for product_data in update_request.products:
        update_data = product_data.dict(exclude={"id"}, exclude_unset=True)
        updated_product = crud.update_product(db, product_data.id, update_data)
        if updated_product:
            updated_products_count += 1

    if updated_products_count > 0:
        crud.recalculate_and_update_audit_percentage(db, audit_id)

    return {"message": f"{updated_products_count} productos actualizados exitosamente."}

@router.put("/{audit_id}/finish", response_model=schemas.Audit)
async def finish_audit(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user.rol != "administrador"):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")

    # Usar la función correcta que calcula basándose en unidades
    crud.recalculate_and_update_audit_percentage(db, audit_id)
    
    db_audit.estado = "finalizada"
    db_audit.finalizada_en = datetime.utcnow()
    db.commit()
    db.refresh(db_audit)
    return db_audit

@router.post("/{audit_id}/collaborators", status_code=status.HTTP_200_OK)
def add_collaborators(audit_id: int, collaborators: schemas.CollaboratorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user.rol != "administrador"):
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta auditoría")

    crud.add_collaborators_to_audit(db, audit_id=audit_id, collaborator_ids=collaborators.collaborator_ids)
    return {"message": "Colaboradores añadidos exitosamente"}

@router.get("/{audit_id}/novelties-by-sku")
def get_novelties_by_sku(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Obtiene todas las novedades de una auditoría agrupadas por SKU."""
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators and current_user.rol not in ["analista", "administrador"]):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
    
    return crud.get_novelties_by_audit(db, audit_id)

@router.get("/{audit_id}/products/{product_id}/novelties", response_model=List[schemas.ProductNovelty])
def get_product_novelties_endpoint(audit_id: int, product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Obtiene todas las novedades de un producto específico."""
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators and current_user.rol not in ["analista", "administrador"]):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
    
    novelties = crud.get_product_novelties(db, product_id)
    return novelties

@router.post("/{audit_id}/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
async def add_surplus_product_to_audit(
    audit_id: int,
    product_data: schemas.SurplusProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Añade un nuevo producto 'sobrante' a una auditoría existente.
    Accesible por el auditor principal o los colaboradores.
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para añadir productos a esta auditoría")

    new_product = crud.create_surplus_product(db, audit_id=audit_id, product_data=product_data)
    if not new_product:
        raise HTTPException(status_code=500, detail="No se pudo crear el producto sobrante.")

    # Notificar a través de WebSocket que se añadió un producto
    try:
        product_for_broadcast = schemas.Product.from_orm(new_product).dict()
        payload = {
            "type": "product_added",
            "product": product_for_broadcast
        }
        await manager.broadcast(json.dumps(payload, default=str), audit_id=audit_id)
    except Exception as e:
        print(f"Error broadcasting new surplus product for audit {audit_id}: {e}")

    # Recalcular porcentaje
    crud.recalculate_and_update_audit_percentage(db, audit_id)

    return new_product

@router.get("/report/details")
async def get_report_details(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene auditorías según filtros.
    Sin filtros: 7 más recientes del día actual.
    Con filtros: todas las que cumplan los criterios.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")

    # Detectar si hay filtros aplicados
    has_filters = any([
        audit_status and audit_status != 'Todos',
        auditor_id,
        ubicacion_origen_id,
        start_date and start_date.strip(),
        end_date and end_date.strip()
    ])
    
    bogota_tz = ZoneInfo("America/Bogota")
    query = db.query(models.Audit).options(
        joinedload(models.Audit.auditor),
        selectinload(models.Audit.productos).selectinload(models.Product.novelties),
        selectinload(models.Audit.productos).joinedload(models.Product.last_modified_by),
        joinedload(models.Audit.ubicacion_origen),
        joinedload(models.Audit.ubicacion_destino)
    ).filter(
        models.Audit.auditor_id.isnot(None)
    )
    
    # Límite temporal inteligente: Si NO hay fechas especificadas, limitar a últimos 30 días
    if not (start_date and start_date.strip()) and not (end_date and end_date.strip()):
        if not has_filters:
            # Sin filtros: solo día actual
            bogota_today = datetime.now(bogota_tz).date()
            start_local = datetime.combine(bogota_today, datetime.min.time()).replace(tzinfo=bogota_tz)
            end_local = datetime.combine(bogota_today, datetime.max.time()).replace(tzinfo=bogota_tz)
            start_utc = start_local.astimezone(timezone.utc)
            end_utc = end_local.astimezone(timezone.utc)
            query = query.filter(
                models.Audit.creada_en >= start_utc,
                models.Audit.creada_en <= end_utc
            )
        else:
            # Con filtros pero sin fechas: últimos 30 días
            default_start = datetime.now(bogota_tz) - timedelta(days=30)
            start_utc = default_start.astimezone(timezone.utc)
            query = query.filter(models.Audit.creada_en >= start_utc)
    
    # Aplicar filtros si existen
    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    if db_status:
        query = query.filter(models.Audit.estado == db_status)
    if auditor_id:
        query = query.filter(models.Audit.auditor_id == auditor_id)
    if ubicacion_origen_id:
        query = query.filter(models.Audit.ubicacion_origen_id == ubicacion_origen_id)
    
    # Aplicar filtros de fecha si existen
    if start_date and start_date.strip():
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
            start_local = datetime.combine(sd, time.min).replace(tzinfo=bogota_tz)
            start_utc = start_local.astimezone(timezone.utc)
            query = query.filter(models.Audit.creada_en >= start_utc)
        except ValueError:
            pass
    
    if end_date and end_date.strip():
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d").date()
            end_local = datetime.combine(ed, time.max).replace(tzinfo=bogota_tz)
            end_utc = end_local.astimezone(timezone.utc)
            query = query.filter(models.Audit.creada_en <= end_utc)
        except ValueError:
            pass
    
    # Ordenar por fecha descendente
    query = query.order_by(models.Audit.creada_en.desc())
    
    # Límite de seguridad: máximo 500 auditorías para prevenir queries masivas
    MAX_AUDITS = 500
    if not has_filters:
        query = query.limit(7)  # Sin filtros: solo 7 más recientes del día
    else:
        query = query.limit(MAX_AUDITS)  # Con filtros: máximo 500
    
    audits = query.all()
    
    # Log si se alcanzó el límite
    if len(audits) >= MAX_AUDITS:
        logger.info(f"⚠️ Query alcanzó límite de {MAX_AUDITS} auditorías. Considerar filtros más específicos.")
    
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"📊 Auditorías encontradas: {len(audits)}")
    if audits:
        logger.info(f"📦 Primera auditoría ID: {audits[0].id}, Productos: {len(audits[0].productos)}")
    
    # Retornar datos con productos
    result = []
    for a in audits:
        productos_serializados = []
        for p in a.productos:
            # Combinar novedades de ambas tablas
            novedades = []
            if p.novedad and p.novedad != 'sin_novedad':
                novedades.append(p.novedad)
            
            # Agregar novedades de product_novelties
            if hasattr(p, 'novelties') and p.novelties:
                for nov in p.novelties:
                    tipo = nov.novedad_tipo.value if hasattr(nov.novedad_tipo, 'value') else str(nov.novedad_tipo)
                    if tipo not in novedades:
                        novedades.append(tipo)
            
            # Combinar en un solo string
            novedad_combinada = ', '.join(novedades) if novedades else 'sin_novedad'
            
            # Determinar quién auditó este producto
            auditado_por = None
            if p.last_modified_by_id and p.last_modified_by:
                auditado_por = p.last_modified_by.nombre
            elif a.auditor:
                auditado_por = a.auditor.nombre
            
            productos_serializados.append({
                "id": p.id,
                "sku": p.sku,
                "nombre_articulo": p.nombre_articulo,
                "cantidad_documento": p.cantidad_documento,
                "cantidad_fisica": p.cantidad_fisica,
                "novedad": novedad_combinada,
                "observaciones": p.observaciones,
                "orden_traslado_original": p.orden_traslado_original,
                "auditado_por": auditado_por
            })
        
        audit_dict = {
            "id": a.id,
            "ubicacion_origen": a.ubicacion_origen,
            "ubicacion_destino": a.ubicacion_destino,
            "estado": a.estado,
            "porcentaje_cumplimiento": a.porcentaje_cumplimiento,
            "creada_en": a.creada_en,
            "auditor": {"id": a.auditor.id, "nombre": a.auditor.nombre} if a.auditor else None,
            "productos": productos_serializados
        }
        logger.info(f"✅ Auditoría {a.id}: {len(audit_dict['productos'])} productos serializados")
        result.append(audit_dict)
    
    return result



@router.get("/statistics/status", response_model=List[schemas.AuditStatusStatistic])
async def get_audit_status_statistics(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el recuento de auditorías por estado.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    # If no filters provided, use the optimized DB aggregation
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        stats = crud.get_audit_statistics_by_status(db)
        return [{"estado": s[0], "count": s[1]} for s in stats]

    # Otherwise, fetch filtered audits and compute counts in-memory
    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    counter = {}
    for a in audits:
        key = a.estado
        counter[key] = counter.get(key, 0) + 1
    return [{"estado": k, "count": v} for k, v in counter.items()]

@router.get("/statistics/average-compliance", response_model=schemas.AverageComplianceStatistic)
async def get_average_compliance_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el porcentaje de cumplimiento promedio de todas las auditorías finalizadas.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    # If no filters, use existing function
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        average_compliance = crud.get_average_compliance(db)
        return {"average_compliance": average_compliance}

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    # compute avg over finalized audits (same logic as before)
    values = [a.porcentaje_cumplimiento for a in audits if a.estado == 'finalizada' and a.porcentaje_cumplimiento is not None]
    if not values:
        return {"average_compliance": 0}
    avg = sum(values) / len(values)
    return {"average_compliance": round(avg)}

@router.get("/statistics/novelty-distribution", response_model=List[schemas.NoveltyDistributionStatistic])
async def get_novelty_distribution_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el recuento de cada tipo de novedad en todos los productos.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    # If no filters use optimized query
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        stats = crud.get_novelty_distribution(db)
        return [{"novedad": s[0], "count": s[1]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    counter = {}
    for a in audits:
        if not a.productos:
            continue
        for p in a.productos:
            key = p.novedad or 'sin_novedad'
            counter[key] = counter.get(key, 0) + 1
    return [{"novedad": k, "count": v} for k, v in counter.items()]

@router.get("/statistics/compliance-by-auditor", response_model=List[schemas.ComplianceByAuditorStatistic])
async def get_compliance_by_auditor_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el cumplimiento promedio por cada auditor.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        stats = crud.get_compliance_by_auditor(db)
        return [{"auditor_nombre": s[0], "average_compliance": round(s[1], 2) if s[1] else 0.0} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    # compute average per auditor
    sums = {}
    counts = {}
    for a in audits:
        if a.auditor and a.porcentaje_cumplimiento is not None:
            name = a.auditor.nombre
            sums[name] = sums.get(name, 0) + a.porcentaje_cumplimiento
            counts[name] = counts.get(name, 0) + 1
    result = []
    for name in sums:
        avg = sums[name] / counts[name]
        result.append({"auditor_nombre": name, "average_compliance": round(avg, 2)})
    return result

@router.get("/statistics/audits-by-period", response_model=List[schemas.AuditsByPeriodStatistic])
async def get_audits_by_period_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el número de auditorías creadas por día dentro de un período dado.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    # If no filters, use optimized DB aggregation
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        stats = crud.get_audits_by_period(db, start_date, end_date)
        return [{"fecha": s[0], "total_auditorias": s[1]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    counter = {}
    for a in audits:
        fecha = a.creada_en.date()
        counter[fecha] = counter.get(fecha, 0) + 1
    items = sorted(counter.items())
    return [{"fecha": s[0], "total_auditorias": s[1]} for s in items]

@router.get("/statistics/top-novelty-skus", response_model=List[schemas.TopNoveltySkuStatistic])
async def get_top_novelty_skus_statistic(
    limit: int = 10,
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene los N SKUs con más novedades (excluyendo 'sin_novedad').
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        stats = crud.get_top_novelty_skus(db, limit)
        return [{"sku": s[0], "nombre_articulo": s[1], "total_novedades": s[2]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    counter = {}
    names = {}
    for a in audits:
        if not a.productos:
            continue
        for p in a.productos:
            if p.novedad == 'sin_novedad':
                continue
            counter[p.sku] = counter.get(p.sku, 0) + 1
            names[p.sku] = p.nombre_articulo
    items = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [{"sku": sku, "nombre_articulo": names.get(sku, ''), "total_novedades": count} for sku, count in items]

@router.post("/{audit_id}/add-ot")
async def add_ot_to_audit(
    audit_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Agrega productos de una OT adicional a una auditoría existente.
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")
    
    if db_audit.estado == "finalizada":
        raise HTTPException(status_code=400, detail="No se puede agregar OT a una auditoría finalizada")
    
    # Validar archivos
    validate_files_batch(files)
    
    all_productos_data = []
    ordenes_procesadas = set()
    
    for file_index, file in enumerate(files):
        content = await file.read()
        validate_excel_file(file, content)
        
        temp_file_path = f"temp_{file.filename}_{file_index}"
        try:
            with open(temp_file_path, "wb") as buffer:
                buffer.write(content)
            
            df = pd.read_excel(temp_file_path, engine='openpyxl', header=None)
            
            header_row = None
            target_patterns = [["número", "documento"], ["sku", "articulo"], ["nombre", "articulo"], ["cantidad"], ["un", "enviada"]]
            for i in range(len(df)):
                row_values = [str(cell).lower().strip() if pd.notna(cell) else "" for cell in df.iloc[i]]
                matches = sum(1 for pattern in target_patterns if any(all(keyword in cell for keyword in pattern) for cell in row_values))
                if matches >= 3:
                    header_row = i
                    break
            
            if header_row is None:
                continue
            
            df = pd.read_excel(temp_file_path, engine='openpyxl', header=header_row)
            
            exact_mapping = {'Número de documento': 'número de documento', 'SKU ARTICULO': 'sku articulo', 'NOMBRE ARTICULO': 'nombre articulo', 'Cantidad': 'cantidad', 'Un Enviada': 'un enviada'}
            column_mapping = {}
            for original_col in df.columns:
                original_col_str = str(original_col).strip().lower()
                for key, val in exact_mapping.items():
                    if original_col_str == key.lower():
                        column_mapping[original_col] = val
                        break
            df = df.rename(columns=column_mapping)
            
            required_columns = ["número de documento", "sku articulo", "nombre articulo", "cantidad", "un enviada"]
            if any(col not in df.columns for col in required_columns):
                continue
            
            df["cantidad"] = pd.to_numeric(df["cantidad"], errors='coerce').fillna(0).astype(int)
            df["un enviada"] = pd.to_numeric(df["un enviada"], errors='coerce').fillna(0).astype(int)
            
            numero_documento = next((str(df.iloc[i][df.columns[0]]).strip() for i in range(len(df)) if pd.notna(df.iloc[i][df.columns[0]]) and "total" not in str(df.iloc[i][df.columns[0]]).lower()), f"Documento_{file_index}")
            ordenes_procesadas.add(numero_documento)
            
            for i, row in df.iterrows():
                sku_value = row.get("sku articulo")
                if pd.isna(sku_value) or "total" in str(sku_value).lower():
                    continue
                
                sku = str(sku_value).strip().split('.')[0]
                orden_traslado = str(numero_documento).strip()
                if "VE" in orden_traslado:
                    match = re.search(r'VE\d+', orden_traslado)
                    if match:
                        orden_traslado = match.group(0)
                
                producto_data = models.Product(
                    auditoria_id=audit_id,
                    sku=sku,
                    nombre_articulo=str(row.get("nombre articulo", "Sin nombre")).strip(),
                    cantidad_documento=row.get("un enviada", 0),
                    cantidad_enviada=row.get("cantidad", 0),
                    orden_traslado_original=orden_traslado,
                    novedad="sin_novedad"
                )
                all_productos_data.append(producto_data)
        
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    if not all_productos_data:
        raise HTTPException(status_code=400, detail="No se encontraron productos válidos en los archivos")
    
    # Agregar productos a la auditoría
    for producto in all_productos_data:
        db.add(producto)
    
    db.commit()
    
    return {
        "message": f"Se agregaron {len(all_productos_data)} productos de {len(ordenes_procesadas)} OT(s)",
        "productos_agregados": len(all_productos_data),
        "ordenes_agregadas": list(ordenes_procesadas)
    }

@router.delete("/{audit_id}")
async def delete_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina una auditoría en estado pendiente.
    Solo el auditor que la creó puede eliminarla.
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if db_audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el auditor que creó la auditoría puede eliminarla")
    
    if db_audit.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar auditorías en estado pendiente")
    
    # Eliminar productos asociados
    db.query(models.Product).filter(models.Product.auditoria_id == audit_id).delete()
    
    # Eliminar auditoría
    db.delete(db_audit)
    db.commit()
    
    return {"message": "Auditoría eliminada exitosamente"}

@router.get("/statistics/average-audit-duration", response_model=schemas.AverageAuditDurationStatistic)
async def get_average_audit_duration_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene la duración promedio de las auditorías finalizadas en horas.
    Accesible solo para analistas y administradores.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")
    
    if not any([audit_status, auditor_id, ubicacion_origen_id, start_date, end_date]):
        average_duration = crud.get_average_audit_duration(db)
        return {"average_duration_hours": average_duration}

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, ubicacion_origen_id=ubicacion_origen_id, start_date=start_date, end_date=end_date)
    durations = []
    for a in audits:
        if a.estado == 'finalizada' and a.finalizada_en and a.creada_en:
            delta = (a.finalizada_en - a.creada_en).total_seconds() / 3600.0
            durations.append(delta)
    if not durations:
        return {"average_duration_hours": 0.0}
    avg = sum(durations) / len(durations)
    return {"average_duration_hours": round(avg, 2)}