import os
import shutil
import pandas as pd
import re
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List, Optional
from fastapi.responses import StreamingResponse
import io
from datetime import date, timedelta
from zoneinfo import ZoneInfo

from backend import models, schemas, crud
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user
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
    payload = {"type": "new_audit", "data": audit_response.dict()}
    try:
        await manager.broadcast_to_all(json.dumps(payload, default=str))
    except Exception as e:
        print(f"Error broadcasting new audit: {e}")
    return audit_response


@router.post("/upload-multiple-files")
async def upload_multiple_audit_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Carga múltiples archivos de Excel para crear una sola auditoría con todas las OTs.
    """
    if current_user.rol != "auditor":
        raise HTTPException(status_code=403, detail="No tienes permiso para cargar archivos.")

    if not files:
        raise HTTPException(status_code=400, detail="No se recibieron archivos")

    all_productos_data = []
    ordenes_procesadas = set()

    for file_index, file in enumerate(files):
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail=f"Solo se permiten archivos Excel. Archivo {file.filename} no válido.")

        temp_file_path = f"temp_{file.filename}_{file_index}"
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

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
        raise HTTPException(status_code=400, detail="No se encontraron productos válidos en los archivos.")

    processed_orders_list = list(ordenes_procesadas)
    num_orders = len(processed_orders_list)
    ubicacion_destino = f"Auditoría OT {processed_orders_list[0]}" if num_orders == 1 else f"Auditoría Múltiple ({', '.join(processed_orders_list)})"
    # Append Colombia local time to ubicacion_destino
    bogota_tz = ZoneInfo("America/Bogota")
    now_bogota = datetime.now(bogota_tz)
    ubicacion_destino += f" - {now_bogota.strftime('%Y-%m-%d %H:%M')}"

    audit_data = schemas.AuditCreate(ubicacion_destino=ubicacion_destino, productos=all_productos_data)
    db_audit = crud.create_audit(db, audit_data, auditor_id=current_user.id)
    
    db.refresh(db_audit)
    audit_response = schemas.AuditResponse.from_orm(db_audit)
    payload = {"type": "new_audit", "data": audit_response.dict()}
    try:
        await manager.broadcast_to_all(json.dumps(payload, default=str))
    except Exception as e:
        print(f"Error broadcasting new audit: {e}")

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
    return [schemas.AuditResponse.from_orm(audit) for audit in audits]

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
    # Construir filtro según el rol
    if current_user.rol in ["analista", "administrador"]:
        # Analistas y admins pueden ver todas las auditorías
        audit = db.query(models.Audit).options(
            joinedload(models.Audit.auditor),
            joinedload(models.Audit.collaborators)
        ).filter(
            models.Audit.auditor_id.isnot(None),
            models.Audit.ubicacion_destino.contains(ot_number)
        ).order_by(models.Audit.creada_en.desc()).first()
    else:
        # Auditores solo ven sus auditorías o donde son colaboradores
        audit = db.query(models.Audit).options(
            joinedload(models.Audit.auditor),
            joinedload(models.Audit.collaborators)
        ).filter(
            models.Audit.auditor_id.isnot(None),
            (
                (models.Audit.auditor_id == current_user.id) |
                (models.Audit.collaborators.any(models.User.id == current_user.id))
            ),
            models.Audit.ubicacion_destino.contains(ot_number)
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
async def iniciar_auditoria(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
    if db_audit.estado != "pendiente":
        raise HTTPException(status_code=400, detail=f"No se puede iniciar una auditoría en estado '{db_audit.estado}'")
    db_audit.estado = "en_progreso"
    db.commit()
    db.refresh(db_audit)
    audit_response = schemas.AuditResponse.from_orm(db_audit)
    payload = {"type": "audit_updated", "data": audit_response.dict()}
    try:
        await manager.broadcast_to_all(json.dumps(payload, default=str))
    except Exception as e:
        print(f"Error broadcasting audit update: {e}")
    return db_audit

@router.get("/{audit_id}", response_model=schemas.AuditDetails)
def get_audit_details(audit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit or (db_audit.auditor_id != current_user.id and current_user not in db_audit.collaborators and current_user.rol not in ["analista", "administrador"]):
        raise HTTPException(status_code=404, detail="Auditoría no encontrada o sin acceso.")
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
            crud.create_product_novelties(db, product_id, product_dict['novelties'], current_user.id)
        
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

        # Broadcast the general audit update to everyone
        if updated_audit:
            try:
                audit_response = schemas.AuditResponse.from_orm(updated_audit)
                payload = {"type": "audit_updated", "data": audit_response.dict()}
                await manager.broadcast_to_all(json.dumps(payload, default=str))
            except Exception as e:
                print(f"Error broadcasting audit update: {e}")

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

    products = crud.get_products_by_audit(db, audit_id=audit_id)
    total_productos = len(products)
    if total_productos > 0:
        correctos = sum(1 for p in products if p.cantidad_fisica == p.cantidad_documento and p.novedad == 'sin_novedad')
        cumplimiento = round((correctos / total_productos) * 100)
    else:
        cumplimiento = 0
    
    db_audit.estado = "finalizada"
    db_audit.porcentaje_cumplimiento = cumplimiento
    # Establecer la fecha de finalización en la zona horaria de Colombia
    # Store finalization time in UTC
    db_audit.finalizada_en = datetime.utcnow()
    db.commit()
    db.refresh(db_audit)
    audit_response = schemas.AuditResponse.from_orm(db_audit)
    payload = {"type": "audit_updated", "data": audit_response.dict()}
    try:
        await manager.broadcast_to_all(json.dumps(payload, default=str))
    except Exception as e:
        print(f"Error broadcasting audit finish: {e}")
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

    # Recalcular y notificar la actualización general de la auditoría
    updated_audit = crud.recalculate_and_update_audit_percentage(db, audit_id)
    if updated_audit:
        try:
            audit_response = schemas.AuditResponse.from_orm(updated_audit)
            payload = {"type": "audit_updated", "data": audit_response.dict()}
            await manager.broadcast_to_all(json.dumps(payload, default=str))
        except Exception as e:
            print(f"Error broadcasting audit update after adding surplus: {e}")

    return new_product

@router.get("/report/details", response_model=List[schemas.AuditDetails])
async def get_report_details(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene los detalles completos de las auditorías para la generación de informes en el frontend.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para acceder a estos datos")

    # Renombrar 'status' a 'state' si es necesario para que coincida con el modelo de BD
    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None

    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
    return audits

@router.get("/report", response_class=StreamingResponse)
async def download_audit_report(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Genera y descarga un informe de auditorías en formato Excel.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para descargar informes")

    # Normalizar el estado si viene como texto legible
    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None

    try:
        audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting audits: {e}")
        audits = []

    if not audits:
        # Si no hay auditorías, devolver Excel vacío
        df = pd.DataFrame(columns=["ID", "Ubicación", "Auditor", "Fecha", "Estado", "Productos", "% Cumplimiento"])
    else:
        data = []
        for audit in audits:
            data.append({
                "ID": audit.id,
                "Ubicación": audit.ubicacion_destino,
                "Auditor": audit.auditor.nombre if audit.auditor else "",
                "Fecha": audit.creada_en.strftime("%Y-%m-%d %H:%M:%S"),
                "Estado": audit.estado,
                "Productos": len(audit.productos),
                "% Cumplimiento": audit.porcentaje_cumplimiento
            })
        df = pd.DataFrame(data)

    stream = io.BytesIO()
    df.to_excel(stream, index=False, sheet_name='Auditorias')
    stream.seek(0)
    
    response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = "attachment; filename=reporte_auditorias.xlsx"
    
    return response

@router.get("/statistics/status", response_model=List[schemas.AuditStatusStatistic])
async def get_audit_status_statistics(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
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
    if not any([audit_status, auditor_id, start_date, end_date]):
        stats = crud.get_audit_statistics_by_status(db)
        return [{"estado": s[0], "count": s[1]} for s in stats]

    # Otherwise, fetch filtered audits and compute counts in-memory
    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
    counter = {}
    for a in audits:
        key = a.estado
        counter[key] = counter.get(key, 0) + 1
    return [{"estado": k, "count": v} for k, v in counter.items()]

@router.get("/statistics/average-compliance", response_model=schemas.AverageComplianceStatistic)
async def get_average_compliance_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
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
    if not any([audit_status, auditor_id, start_date, end_date]):
        average_compliance = crud.get_average_compliance(db)
        return {"average_compliance": average_compliance}

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
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
    if not any([audit_status, auditor_id, start_date, end_date]):
        stats = crud.get_novelty_distribution(db)
        return [{"novedad": s[0], "count": s[1]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
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
    
    if not any([audit_status, auditor_id, start_date, end_date]):
        stats = crud.get_compliance_by_auditor(db)
        return [{"auditor_nombre": s[0], "average_compliance": round(s[1], 2) if s[1] else 0.0} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
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
    if not any([audit_status, auditor_id, start_date, end_date]):
        stats = crud.get_audits_by_period(db, start_date, end_date)
        return [{"fecha": s[0], "total_auditorias": s[1]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
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
    
    if not any([audit_status, auditor_id, start_date, end_date]):
        stats = crud.get_top_novelty_skus(db, limit)
        return [{"sku": s[0], "nombre_articulo": s[1], "total_novedades": s[2]} for s in stats]

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
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

@router.get("/statistics/average-audit-duration", response_model=schemas.AverageAuditDurationStatistic)
async def get_average_audit_duration_statistic(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
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
    
    if not any([audit_status, auditor_id, start_date, end_date]):
        average_duration = crud.get_average_audit_duration(db)
        return {"average_duration_hours": average_duration}

    db_status = audit_status.lower().replace(' ', '_') if audit_status and audit_status != 'Todos' else None
    audits = crud.get_audits_with_filters(db, status=db_status, auditor_id=auditor_id, start_date=start_date, end_date=end_date)
    durations = []
    for a in audits:
        if a.estado == 'finalizada' and a.finalizada_en and a.creada_en:
            delta = (a.finalizada_en - a.creada_en).total_seconds() / 3600.0
            durations.append(delta)
    if not durations:
        return {"average_duration_hours": 0.0}
    avg = sum(durations) / len(durations)
    return {"average_duration_hours": round(avg, 2)}