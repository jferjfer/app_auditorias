import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import secrets

from backend import models, schemas
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user, verify_password
from backend.utils.validators import validate_excel_file

router = APIRouter(
    prefix="/ultima-milla",
    tags=["Última Milla"],
)

# Almacenamiento temporal de tokens de confirmación (en producción usar Redis)
confirmation_tokens = {}

@router.post("/upload")
async def upload_ultima_milla_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Carga archivo Excel con formato de última milla (librobaseum.xlsx)
    Columnas esperadas: bodega, documento domiciliario, nombre domiciliario, 
                       sku, numero de pedido, descripcion, gramaje, cantidad
    """
    if current_user.rol not in ["auditor", "analista", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para cargar archivos")
    
    content = await file.read()
    validate_excel_file(file, content)
    
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)
        
        df = pd.read_excel(temp_file_path, engine='openpyxl')
        
        # Validar columnas requeridas
        required_columns = ['bodega', 'documento domiciliario', 'nombre domiciliario', 
                          'sku', 'numero de pedido', 'descripcion', 'gramaje', 'cantidad']
        
        df.columns = df.columns.str.strip().str.lower()
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Columnas faltantes: {', '.join(missing_columns)}"
            )
        
        # Limpiar datos
        df = df.dropna(subset=['sku', 'numero de pedido'])
        df['cantidad'] = pd.to_numeric(df['cantidad'], errors='coerce').fillna(0).astype(int)
        
        pedidos_creados = 0
        productos_creados = 0
        bodegas = set()
        domiciliarios = set()
        
        # Obtener pedidos existentes de una vez
        numeros_pedidos = df['numero de pedido'].unique().tolist()
        existing_pedidos = set(
            p.numero_pedido for p in db.query(models.PedidoUltimaMilla.numero_pedido).filter(
                models.PedidoUltimaMilla.numero_pedido.in_([str(n) for n in numeros_pedidos])
            ).all()
        )
        
        pedidos_batch = []
        productos_batch = []
        
        # Agrupar por pedido
        for numero_pedido, grupo in df.groupby('numero de pedido'):
            # Verificar si el pedido ya existe
            if str(numero_pedido) in existing_pedidos:
                continue
            
            primera_fila = grupo.iloc[0]
            bodega = str(primera_fila['bodega']).strip()
            documento = str(primera_fila['documento domiciliario']).strip()
            nombre = str(primera_fila['nombre domiciliario']).strip()
            
            bodegas.add(bodega)
            domiciliarios.add(documento)
            
            # Crear pedido
            pedido = models.PedidoUltimaMilla(
                bodega=bodega,
                documento_domiciliario=documento,
                nombre_domiciliario=nombre,
                numero_pedido=str(numero_pedido),
                estado='pendiente'
            )
            pedidos_batch.append(pedido)
            pedidos_creados += 1
            
            # Crear productos del pedido
            for _, row in grupo.iterrows():
                if pd.isna(row['sku']):
                    continue
                
                producto = models.ProductoPedidoUltimaMilla(
                    pedido_id=None,  # Se asignará después
                    sku=str(row['sku']).strip(),
                    descripcion=str(row['descripcion']).strip(),
                    gramaje=str(row['gramaje']).strip() if pd.notna(row['gramaje']) else None,
                    cantidad_pedida=int(row['cantidad'])
                )
                productos_batch.append((pedido, producto))
                productos_creados += 1
        
        # Insertar pedidos en lote
        if pedidos_batch:
            db.add_all(pedidos_batch)
            db.flush()
            
            # Asignar IDs de pedidos a productos
            for pedido, producto in productos_batch:
                producto.pedido_id = pedido.id
                db.add(producto)
        
        db.commit()
        
        return {
            "message": f"{pedidos_creados} pedidos cargados exitosamente",
            "pedidos": pedidos_creados,
            "productos": productos_creados,
            "bodegas": list(bodegas),
            "total_domiciliarios": len(domiciliarios)
        }
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/bodegas", response_model=List[schemas.BodegaStats])
def get_bodegas(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene lista de bodegas con estadísticas"""
    if current_user.rol not in ["auditor", "analista", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder")
    
    bodegas = db.query(
        models.PedidoUltimaMilla.bodega,
        func.count(func.distinct(models.PedidoUltimaMilla.documento_domiciliario)).label('total_domiciliarios'),
        func.count(models.PedidoUltimaMilla.id).label('total_pedidos')
    ).group_by(models.PedidoUltimaMilla.bodega).all()
    
    # Calcular pendientes y auditados manualmente
    result = []
    for b in bodegas:
        pendientes = db.query(func.count(models.PedidoUltimaMilla.id)).filter(
            models.PedidoUltimaMilla.bodega == b[0],
            models.PedidoUltimaMilla.estado == 'pendiente'
        ).scalar() or 0
        
        auditados = db.query(func.count(models.PedidoUltimaMilla.id)).filter(
            models.PedidoUltimaMilla.bodega == b[0],
            models.PedidoUltimaMilla.estado == 'auditado'
        ).scalar() or 0
        
        result.append((b[0], b[1], b[2], pendientes, auditados))
    
    bodegas = result
    
    return [
        schemas.BodegaStats(
            bodega=b[0],
            total_domiciliarios=b[1] or 0,
            total_pedidos=b[2] or 0,
            pedidos_pendientes=b[3] or 0,
            pedidos_auditados=b[4] or 0
        )
        for b in bodegas
    ]

@router.get("/domiciliarios", response_model=List[schemas.DomiciliarioStats])
def get_domiciliarios(
    bodega: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene lista de domiciliarios de una bodega"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden acceder")
    
    domiciliarios = db.query(
        models.PedidoUltimaMilla.documento_domiciliario,
        models.PedidoUltimaMilla.nombre_domiciliario,
        models.PedidoUltimaMilla.bodega,
        func.count(models.PedidoUltimaMilla.id).label('total_pedidos')
    ).filter(
        models.PedidoUltimaMilla.bodega == bodega
    ).group_by(
        models.PedidoUltimaMilla.documento_domiciliario,
        models.PedidoUltimaMilla.nombre_domiciliario,
        models.PedidoUltimaMilla.bodega
    ).all()
    
    # Calcular auditados y pendientes manualmente
    result = []
    for d in domiciliarios:
        auditados = db.query(func.count(models.PedidoUltimaMilla.id)).filter(
            models.PedidoUltimaMilla.documento_domiciliario == d[0],
            models.PedidoUltimaMilla.bodega == bodega,
            models.PedidoUltimaMilla.estado == 'auditado'
        ).scalar() or 0
        
        pendientes = db.query(func.count(models.PedidoUltimaMilla.id)).filter(
            models.PedidoUltimaMilla.documento_domiciliario == d[0],
            models.PedidoUltimaMilla.bodega == bodega,
            models.PedidoUltimaMilla.estado == 'pendiente'
        ).scalar() or 0
        
        result.append((d[0], d[1], d[2], d[3], auditados, pendientes))
    
    domiciliarios = result
    
    return [
        schemas.DomiciliarioStats(
            documento=d[0],
            nombre=d[1],
            bodega=d[2],
            total_pedidos=d[3] or 0,
            pedidos_auditados=d[4] or 0,
            pedidos_pendientes=d[5] or 0
        )
        for d in domiciliarios
    ]

@router.get("/mis-auditorias")
def get_mis_auditorias_ultima_milla(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene las auditorías de última milla del auditor actual"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden acceder")
    
    # Obtener auditorías de última milla del usuario
    auditorias = db.query(models.Audit).filter(
        models.Audit.auditor_id == current_user.id,
        models.Audit.modo_auditoria == 'ultima_milla'
    ).order_by(models.Audit.creada_en.desc()).limit(10).all()
    
    result = []
    for auditoria in auditorias:
        # Obtener pedidos asociados
        pedidos = db.query(models.PedidoUltimaMilla).filter(
            models.PedidoUltimaMilla.auditoria_id == auditoria.id
        ).all()
        
        if not pedidos:
            continue
        
        # Obtener info del primer pedido para mostrar bodega y domiciliario
        primer_pedido = pedidos[0]
        
        # Contar productos totales y auditados
        pedido_ids = [p.id for p in pedidos]
        total_productos = db.query(func.count(models.ProductoPedidoUltimaMilla.id)).filter(
            models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
        ).scalar() or 0
        
        productos_auditados = db.query(func.count(models.ProductoPedidoUltimaMilla.id)).filter(
            models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids),
            models.ProductoPedidoUltimaMilla.cantidad_fisica.isnot(None)
        ).scalar() or 0
        
        result.append({
            'auditoria_id': auditoria.id,
            'bodega': primer_pedido.bodega,
            'documento_domiciliario': primer_pedido.documento_domiciliario,
            'nombre_domiciliario': primer_pedido.nombre_domiciliario,
            'total_pedidos': len(pedidos),
            'total_productos': total_productos,
            'productos_auditados': productos_auditados,
            'estado': auditoria.estado,
            'porcentaje_cumplimiento': auditoria.porcentaje_cumplimiento,
            'creada_en': auditoria.creada_en,
            'finalizada_en': auditoria.finalizada_en
        })
    
    return result

@router.post("/confirmar-auditor", response_model=schemas.ConfirmarAuditorResponse)
def confirmar_auditor(
    request: schemas.ConfirmarAuditorRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Confirma identidad del auditor con contraseña"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden confirmar")
    
    # Verificar contraseña
    if not verify_password(request.password, current_user.contrasena_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    
    # Generar token de confirmación válido por 30 minutos
    token = secrets.token_urlsafe(32)
    expiration = datetime.utcnow() + timedelta(minutes=30)
    
    confirmation_tokens[token] = {
        'user_id': current_user.id,
        'expires_at': expiration
    }
    
    return schemas.ConfirmarAuditorResponse(
        confirmed=True,
        auditor_id=current_user.id,
        auditor_nombre=current_user.nombre,
        token_confirmacion=token
    )

@router.get("/pedidos", response_model=List[schemas.PedidoResumen])
def get_pedidos_domiciliario(
    documento: str,
    bodega: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene pedidos de un domiciliario"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden acceder")
    
    query = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.documento_domiciliario == documento
    )
    
    if bodega:
        query = query.filter(models.PedidoUltimaMilla.bodega == bodega)
    
    pedidos = query.all()
    
    resultado = []
    for pedido in pedidos:
        total_productos = db.query(func.count(models.ProductoPedidoUltimaMilla.id)).filter(
            models.ProductoPedidoUltimaMilla.pedido_id == pedido.id
        ).scalar()
        
        total_unidades = db.query(func.sum(models.ProductoPedidoUltimaMilla.cantidad_pedida)).filter(
            models.ProductoPedidoUltimaMilla.pedido_id == pedido.id
        ).scalar() or 0
        
        resultado.append(schemas.PedidoResumen(
            numero_pedido=pedido.numero_pedido,
            total_productos=total_productos or 0,
            total_unidades=int(total_unidades),
            estado=pedido.estado
        ))
    
    return resultado

@router.post("/iniciar-auditoria", response_model=schemas.IniciarAuditoriaUltimaMillaResponse)
def iniciar_auditoria_ultima_milla(
    request: schemas.IniciarAuditoriaUltimaMillaRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Inicia auditoría de última milla para un domiciliario"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden iniciar auditorías")
    
    # Obtener pedidos
    query = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.documento_domiciliario == request.documento_domiciliario,
        models.PedidoUltimaMilla.bodega == request.bodega,
        models.PedidoUltimaMilla.estado == 'pendiente'
    )
    
    if request.pedidos_seleccionados:
        query = query.filter(models.PedidoUltimaMilla.numero_pedido.in_(request.pedidos_seleccionados))
    
    pedidos = query.all()
    
    if not pedidos:
        raise HTTPException(status_code=404, detail="No se encontraron pedidos pendientes")
    
    # Crear auditoría
    auditoria = models.Audit(
        auditor_id=current_user.id,
        estado='en_progreso',
        modo_auditoria='ultima_milla'
    )
    db.add(auditoria)
    db.flush()
    
    # Asociar pedidos a auditoría
    total_productos = 0
    pedidos_incluidos = []
    
    for pedido in pedidos:
        pedido.auditoria_id = auditoria.id
        pedidos_incluidos.append(pedido.numero_pedido)
        
        # Contar productos
        productos_count = db.query(func.count(models.ProductoPedidoUltimaMilla.id)).filter(
            models.ProductoPedidoUltimaMilla.pedido_id == pedido.id
        ).scalar()
        total_productos += productos_count or 0
    
    db.commit()
    
    return schemas.IniciarAuditoriaUltimaMillaResponse(
        auditoria_id=auditoria.id,
        total_productos=total_productos,
        pedidos_incluidos=pedidos_incluidos
    )

@router.get("/auditoria/{auditoria_id}/productos")
def get_productos_auditoria(
    auditoria_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Obtiene productos de una auditoría de última milla con novedades"""
    auditoria = db.query(models.Audit).filter(models.Audit.id == auditoria_id).first()
    
    if not auditoria:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if auditoria.auditor_id != current_user.id and current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")
    
    # Obtener pedidos de la auditoría
    pedidos = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.auditoria_id == auditoria_id
    ).all()
    
    pedido_ids = [p.id for p in pedidos]
    
    # Obtener productos con novedades
    productos = db.query(models.ProductoPedidoUltimaMilla).options(
        joinedload(models.ProductoPedidoUltimaMilla.novedades)
    ).filter(
        models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
    ).all()
    
    # Crear diccionario de pedidos para búsqueda rápida
    pedidos_dict = {p.id: p.numero_pedido for p in pedidos}
    
    # Agregar numero_pedido y novedades a cada producto
    result = []
    for producto in productos:
        novedades_list = [
            {
                'tipo': nov.tipo_novedad,
                'cantidad': nov.cantidad,
                'observaciones': nov.observaciones
            }
            for nov in producto.novedades
        ]
        
        result.append({
            'id': producto.id,
            'pedido_id': producto.pedido_id,
            'sku': producto.sku,
            'descripcion': producto.descripcion,
            'gramaje': producto.gramaje,
            'cantidad_pedida': producto.cantidad_pedida,
            'cantidad_fisica': producto.cantidad_fisica,
            'novedad': producto.novedad,
            'observaciones': producto.observaciones,
            'auditado_por': producto.auditado_por,
            'auditado_en': producto.auditado_en,
            'numero_pedido': pedidos_dict.get(producto.pedido_id, 'N/A'),
            'novedades': novedades_list
        })
    
    return result

@router.put("/producto/{producto_id}")
def actualizar_producto_ultima_milla(
    producto_id: int,
    request: schemas.ActualizarProductoUltimaMillaRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Actualiza producto de última milla con novedades múltiples"""
    if current_user.rol not in ["auditor", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo auditores pueden actualizar")
    
    producto = db.query(models.ProductoPedidoUltimaMilla).filter(
        models.ProductoPedidoUltimaMilla.id == producto_id
    ).first()
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar que el auditor tenga acceso
    pedido = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.id == producto.pedido_id
    ).first()
    
    if not pedido or not pedido.auditoria_id:
        raise HTTPException(status_code=400, detail="Producto no está en auditoría activa")
    
    auditoria = db.query(models.Audit).filter(models.Audit.id == pedido.auditoria_id).first()
    
    if auditoria.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")
    
    # Validar que suma de novedades = cantidad_fisica
    suma_novedades = sum(n.get('cantidad', 0) for n in request.novedades)
    if suma_novedades != request.cantidad_fisica:
        raise HTTPException(
            status_code=400, 
            detail=f"La suma de novedades ({suma_novedades}) debe ser igual a cantidad física ({request.cantidad_fisica})"
        )
    
    # Actualizar producto
    producto.cantidad_fisica = request.cantidad_fisica
    producto.observaciones = request.observaciones
    producto.auditado_por = current_user.id
    producto.auditado_en = datetime.utcnow()
    
    # Determinar novedad principal (la que tenga mayor cantidad que no sea sin_novedad)
    novedad_principal = 'sin_novedad'
    max_cantidad = 0
    for nov in request.novedades:
        if nov.get('tipo') != 'sin_novedad' and nov.get('cantidad', 0) > max_cantidad:
            max_cantidad = nov.get('cantidad', 0)
            novedad_principal = nov.get('tipo')
    producto.novedad = novedad_principal
    
    # Eliminar novedades anteriores
    db.query(models.NovedadProductoUltimaMilla).filter(
        models.NovedadProductoUltimaMilla.producto_id == producto_id
    ).delete()
    
    # Crear nuevas novedades
    for novedad_data in request.novedades:
        if novedad_data.get('cantidad', 0) > 0:
            novedad = models.NovedadProductoUltimaMilla(
                producto_id=producto_id,
                tipo_novedad=novedad_data['tipo'],
                cantidad=novedad_data['cantidad'],
                observaciones=novedad_data.get('observaciones')
            )
            db.add(novedad)
    
    db.commit()
    db.refresh(producto)
    
    return {"message": "Producto actualizado", "producto": producto}

@router.put("/auditoria/{auditoria_id}/finalizar", response_model=schemas.FinalizarAuditoriaUltimaMillaResponse)
def finalizar_auditoria_ultima_milla(
    auditoria_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Finaliza auditoría de última milla con cálculo de novedades"""
    auditoria = db.query(models.Audit).filter(models.Audit.id == auditoria_id).first()
    
    if not auditoria:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if auditoria.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para finalizar esta auditoría")
    
    # Obtener pedidos y productos
    pedidos = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.auditoria_id == auditoria_id
    ).all()
    
    pedido_ids = [p.id for p in pedidos]
    
    productos = db.query(models.ProductoPedidoUltimaMilla).options(
        joinedload(models.ProductoPedidoUltimaMilla.novedades)
    ).filter(
        models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
    ).all()
    
    # Calcular cumplimiento
    total_productos = len(productos)
    productos_auditados = sum(1 for p in productos if p.cantidad_fisica is not None)
    
    # Contar productos OK: cantidad física = pedida Y solo tiene novedad 'sin_novedad'
    productos_ok = 0
    for p in productos:
        if p.cantidad_fisica == p.cantidad_pedida:
            # Verificar que todas las novedades sean 'sin_novedad'
            if all(n.tipo_novedad == 'sin_novedad' for n in p.novedades):
                productos_ok += 1
    
    porcentaje_cumplimiento = (productos_ok / total_productos * 100) if total_productos > 0 else 0
    
    # Contar novedades por tipo desde la tabla de novedades
    novedades = {}
    for producto in productos:
        for novedad in producto.novedades:
            tipo = novedad.tipo_novedad
            if tipo not in novedades:
                novedades[tipo] = 0
            novedades[tipo] += novedad.cantidad
    
    # Actualizar auditoría
    auditoria.estado = 'finalizada'
    auditoria.finalizada_en = datetime.utcnow()
    auditoria.porcentaje_cumplimiento = int(porcentaje_cumplimiento)
    
    # Marcar pedidos como auditados
    for pedido in pedidos:
        pedido.estado = 'auditado'
    
    db.commit()
    
    return schemas.FinalizarAuditoriaUltimaMillaResponse(
        porcentaje_cumplimiento=round(porcentaje_cumplimiento, 2),
        productos_auditados=productos_auditados,
        novedades=novedades
    )

@router.get("/estadisticas/cumplimiento-auditor")
def get_cumplimiento_por_auditor_ultima_milla(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Estadísticas de cumplimiento por auditor (solo analistas)"""
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo analistas pueden ver estadísticas")
    
    stats = db.query(
        models.User.nombre,
        func.avg(models.Audit.porcentaje_cumplimiento).label('avg_cumplimiento'),
        func.count(models.Audit.id).label('total_auditorias')
    ).join(
        models.Audit, models.User.id == models.Audit.auditor_id
    ).filter(
        models.Audit.modo_auditoria == 'ultima_milla',
        models.Audit.estado == 'finalizada'
    ).group_by(models.User.nombre).all()
    
    return [
        {
            "auditor_nombre": s[0],
            "cumplimiento_promedio": round(s[1], 2) if s[1] else 0,
            "total_auditorias": s[2]
        }
        for s in stats
    ]

@router.get("/estadisticas/cumplimiento-bodega")
def get_cumplimiento_por_bodega(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Estadísticas de cumplimiento por bodega (solo analistas)"""
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=403, detail="Solo analistas pueden ver estadísticas")
    
    stats = db.query(
        models.PedidoUltimaMilla.bodega,
        func.count(models.PedidoUltimaMilla.id).label('total_pedidos'),
        func.sum(func.cast(models.PedidoUltimaMilla.estado == 'auditado', db.bind.dialect.name == 'postgresql' and 'INTEGER' or 'SIGNED')).label('pedidos_auditados')
    ).group_by(models.PedidoUltimaMilla.bodega).all()
    
    return [
        {
            "bodega": s[0],
            "total_pedidos": s[1],
            "pedidos_auditados": s[2] or 0,
            "porcentaje_auditado": round((s[2] or 0) / s[1] * 100, 2) if s[1] > 0 else 0
        }
        for s in stats
    ]

@router.delete("/limpiar-pendientes")
def limpiar_pedidos_pendientes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Elimina todos los pedidos pendientes (solo analistas)"""
    if current_user.rol != "analista":
        raise HTTPException(status_code=403, detail="Solo analistas pueden limpiar pedidos")
    
    # Contar pedidos a eliminar
    count = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.estado == 'pendiente'
    ).count()
    
    # Eliminar productos de pedidos pendientes
    pedidos_pendientes = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.estado == 'pendiente'
    ).all()
    
    pedido_ids = [p.id for p in pedidos_pendientes]
    
    if pedido_ids:
        db.query(models.ProductoPedidoUltimaMilla).filter(
            models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
        ).delete(synchronize_session=False)
        
        # Eliminar pedidos
        db.query(models.PedidoUltimaMilla).filter(
            models.PedidoUltimaMilla.estado == 'pendiente'
        ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Se eliminaron {count} pedidos pendientes",
        "eliminados": count
    }

@router.delete("/limpiar-antiguos")
def limpiar_pedidos_antiguos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Elimina pedidos pendientes con más de 24 horas (solo analistas)"""
    if current_user.rol != "analista":
        raise HTTPException(status_code=403, detail="Solo analistas pueden limpiar pedidos")
    
    limite = datetime.utcnow() - timedelta(hours=24)
    
    # Contar pedidos a eliminar
    pedidos_antiguos = db.query(models.PedidoUltimaMilla).filter(
        models.PedidoUltimaMilla.estado == 'pendiente',
        models.PedidoUltimaMilla.fecha_carga < limite
    ).all()
    
    count = len(pedidos_antiguos)
    pedido_ids = [p.id for p in pedidos_antiguos]
    
    if pedido_ids:
        # Eliminar productos
        db.query(models.ProductoPedidoUltimaMilla).filter(
            models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
        ).delete(synchronize_session=False)
        
        # Eliminar pedidos
        db.query(models.PedidoUltimaMilla).filter(
            models.PedidoUltimaMilla.id.in_(pedido_ids)
        ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Se eliminaron {count} pedidos antiguos (>24h)",
        "eliminados": count
    }
