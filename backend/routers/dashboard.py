"""
Endpoint unificado del dashboard del analista.
Retorna estadísticas + auditorías paginadas en una sola request.
Incluye caché en memoria para consultas sin filtros.
"""
import logging
from datetime import datetime, timezone, timedelta, time
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Date

from backend import models
from backend.dependencies import get_db
from backend.services.auth_service import get_current_user

logger = logging.getLogger("uvicorn")

router = APIRouter(
    prefix="/audits",
    tags=["Dashboard"],
)

# --- Caché en memoria ---
_cache = {}
CACHE_TTL_SECONDS = 300  # 5 minutos


def _get_cached(key: str):
    if key in _cache:
        data, timestamp = _cache[key]
        if (datetime.utcnow() - timestamp).total_seconds() < CACHE_TTL_SECONDS:
            return data
        del _cache[key]
    return None


def _set_cache(key: str, data):
    _cache[key] = (data, datetime.utcnow())


def _build_base_query(db: Session, filters: dict):
    """Construye la query base filtrada para auditorías."""
    bogota_tz = ZoneInfo("America/Bogota")

    query = db.query(models.Audit).filter(
        models.Audit.auditor_id.isnot(None)
    )

    audit_status = filters.get("audit_status")
    auditor_id = filters.get("auditor_id")
    ubicacion_origen_id = filters.get("ubicacion_origen_id")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    # Sin fechas: últimos 30 días
    if not start_date and not end_date:
        default_start = datetime.now(bogota_tz) - timedelta(days=30)
        start_utc = default_start.astimezone(timezone.utc)
        query = query.filter(models.Audit.creada_en >= start_utc)

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

    if audit_status and audit_status != "Todos":
        db_status = audit_status.lower().replace(' ', '_')
        query = query.filter(models.Audit.estado == db_status)

    if auditor_id:
        query = query.filter(models.Audit.auditor_id == int(auditor_id))

    if ubicacion_origen_id:
        query = query.filter(models.Audit.ubicacion_origen_id == int(ubicacion_origen_id))

    return query


@router.get("/dashboard-data")
async def get_dashboard_data(
    audit_status: Optional[str] = None,
    auditor_id: Optional[int] = None,
    ubicacion_origen_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 0,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Endpoint unificado: retorna estadísticas + auditorías paginadas (sin productos).
    Una sola request en vez de 8.
    """
    if current_user.rol not in ["analista", "administrador"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos")

    filters = {
        "audit_status": audit_status,
        "auditor_id": auditor_id,
        "ubicacion_origen_id": ubicacion_origen_id,
        "start_date": start_date,
        "end_date": end_date,
    }

    has_filters = any([
        audit_status and audit_status != 'Todos',
        auditor_id,
        ubicacion_origen_id,
        start_date and start_date.strip(),
        end_date and end_date.strip()
    ])

    # Intentar caché si no hay filtros
    cache_key = f"dashboard_no_filters_page{page}"
    if not has_filters:
        cached = _get_cached(cache_key)
        if cached:
            logger.info("📦 Dashboard servido desde caché")
            return cached

    bogota_tz = ZoneInfo("America/Bogota")
    base_query = _build_base_query(db, filters)

    # --- Estadísticas (agregaciones SQL, sin cargar objetos) ---

    # 1. Status counts
    status_counts = base_query.with_entities(
        models.Audit.estado,
        func.count(models.Audit.id)
    ).group_by(models.Audit.estado).all()
    status_data = [{"estado": s[0], "count": s[1]} for s in status_counts]

    # 2. Average compliance
    avg_compliance = base_query.with_entities(
        func.avg(models.Audit.porcentaje_cumplimiento)
    ).filter(
        models.Audit.estado == 'finalizada',
        models.Audit.porcentaje_cumplimiento.isnot(None)
    ).scalar()

    # 3. Average duration
    avg_duration = base_query.with_entities(
        func.avg(func.extract('epoch', models.Audit.finalizada_en - models.Audit.creada_en)) / 3600
    ).filter(
        models.Audit.estado == 'finalizada',
        models.Audit.finalizada_en.isnot(None)
    ).scalar()

    # 4. Novelty distribution (desde product_novelties)
    novelty_query = db.query(
        models.ProductNovelty.novedad_tipo,
        func.count(models.ProductNovelty.id)
    ).join(models.Product).join(models.Audit).filter(
        models.Audit.auditor_id.isnot(None),
        models.ProductNovelty.novedad_tipo != 'sin_novedad'
    )
    # Aplicar mismos filtros de fecha/estado/auditor
    novelty_query = _apply_filters_to_query(novelty_query, filters, bogota_tz)
    novelty_dist = novelty_query.group_by(models.ProductNovelty.novedad_tipo).all()
    novelty_data = [{"novedad": s[0].value if hasattr(s[0], 'value') else str(s[0]), "count": s[1]} for s in novelty_dist]

    # 5. Compliance by auditor
    compliance_query = db.query(
        models.User.nombre,
        func.avg(models.Audit.porcentaje_cumplimiento)
    ).join(models.Audit, models.User.id == models.Audit.auditor_id).filter(
        models.Audit.auditor_id.isnot(None),
        models.Audit.porcentaje_cumplimiento.isnot(None)
    )
    compliance_query = _apply_filters_to_query(compliance_query, filters, bogota_tz)
    compliance_by_auditor = compliance_query.group_by(models.User.nombre).all()
    compliance_data = [{"auditor_nombre": s[0], "average_compliance": round(s[1], 2) if s[1] else 0.0} for s in compliance_by_auditor]

    # 6. Audits by period
    period_query = db.query(
        cast(models.Audit.creada_en, Date).label('fecha'),
        func.count(models.Audit.id).label('total')
    ).filter(models.Audit.auditor_id.isnot(None))
    period_query = _apply_filters_to_query(period_query, filters, bogota_tz)
    period_results = period_query.group_by('fecha').order_by('fecha').all()
    period_data = [{"fecha": str(s[0]), "total_auditorias": s[1]} for s in period_results]

    # 7. Top novelty SKUs
    top_skus_query = db.query(
        models.Product.sku,
        models.Product.nombre_articulo,
        func.count(models.ProductNovelty.id).label('total_novedades')
    ).join(models.ProductNovelty).join(models.Audit).filter(
        models.ProductNovelty.novedad_tipo != 'sin_novedad',
        models.Audit.auditor_id.isnot(None)
    )
    top_skus_query = _apply_filters_to_query(top_skus_query, filters, bogota_tz)
    top_skus = top_skus_query.group_by(
        models.Product.sku, models.Product.nombre_articulo
    ).order_by(func.count(models.ProductNovelty.id).desc()).limit(10).all()
    top_skus_data = [{"sku": s[0], "nombre_articulo": s[1], "total_novedades": s[2]} for s in top_skus]

    # --- Auditorías paginadas (SIN productos) ---
    total_audits = base_query.count()

    audits_page = base_query.options(
        joinedload(models.Audit.auditor),
        joinedload(models.Audit.ubicacion_origen),
        joinedload(models.Audit.ubicacion_destino)
    ).order_by(
        models.Audit.creada_en.desc()
    ).offset(page * page_size).limit(page_size).all()

    audits_data = []
    for a in audits_page:
        audits_data.append({
            "id": a.id,
            "ubicacion_origen": {"id": a.ubicacion_origen.id, "nombre": a.ubicacion_origen.nombre} if a.ubicacion_origen else None,
            "ubicacion_destino": {"id": a.ubicacion_destino.id, "nombre": a.ubicacion_destino.nombre} if a.ubicacion_destino else None,
            "auditor": {"id": a.auditor.id, "nombre": a.auditor.nombre} if a.auditor else None,
            "estado": a.estado,
            "porcentaje_cumplimiento": a.porcentaje_cumplimiento,
            "creada_en": (a.creada_en.isoformat() + 'Z') if a.creada_en else None,
        })

    result = {
        "stats": {
            "status": status_data,
            "averageCompliance": {"average_compliance": round(avg_compliance) if avg_compliance else 0},
            "averageAuditDuration": {"average_duration_hours": round(avg_duration, 2) if avg_duration else 0.0},
            "noveltyDistribution": novelty_data,
            "complianceByAuditor": compliance_data,
            "auditsByPeriod": period_data,
            "topNoveltySkus": top_skus_data,
        },
        "audits": audits_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total_audits,
            "total_pages": (total_audits + page_size - 1) // page_size
        }
    }

    # Guardar en caché si no hay filtros
    if not has_filters:
        _set_cache(cache_key, result)

    return result


def _apply_filters_to_query(query, filters: dict, bogota_tz):
    """Aplica filtros de fecha/estado/auditor/ubicacion a una query genérica."""
    audit_status = filters.get("audit_status")
    auditor_id = filters.get("auditor_id")
    ubicacion_origen_id = filters.get("ubicacion_origen_id")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    if not start_date and not end_date:
        default_start = datetime.now(bogota_tz) - timedelta(days=30)
        start_utc = default_start.astimezone(timezone.utc)
        query = query.filter(models.Audit.creada_en >= start_utc)

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

    if audit_status and audit_status != "Todos":
        db_status = audit_status.lower().replace(' ', '_')
        query = query.filter(models.Audit.estado == db_status)

    if auditor_id:
        query = query.filter(models.Audit.auditor_id == int(auditor_id))

    if ubicacion_origen_id:
        query = query.filter(models.Audit.ubicacion_origen_id == int(ubicacion_origen_id))

    return query
