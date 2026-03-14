"""
Middleware de seguridad para rate limiting y protección contra ataques
"""
from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

# Rate limiting storage
rate_limit_storage = defaultdict(lambda: {"count": 0, "reset_time": datetime.utcnow()})
cleanup_task = None

async def cleanup_old_entries():
    """Limpia entradas antiguas cada 5 minutos"""
    while True:
        await asyncio.sleep(300)  # 5 minutos
        now = datetime.utcnow()
        to_delete = [ip for ip, data in rate_limit_storage.items() 
                     if (now - data["reset_time"]).seconds > 300]
        for ip in to_delete:
            del rate_limit_storage[ip]

async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting global: 100 requests por minuto por IP
    Endpoints sensibles tienen límites adicionales en sus routers
    """
    client_ip = request.client.host
    now = datetime.utcnow()
    
    # Excluir endpoints estáticos y WebSocket
    if request.url.path.startswith(("/assets", "/uploads", "/api/ws")):
        return await call_next(request)
    
    # Obtener o crear entrada
    entry = rate_limit_storage[client_ip]
    
    # Reset si pasó 1 minuto
    if (now - entry["reset_time"]).seconds >= 60:
        entry["count"] = 0
        entry["reset_time"] = now
    
    # Incrementar contador
    entry["count"] += 1
    
    # Verificar límite
    if entry["count"] > 100:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas solicitudes. Intenta en 1 minuto."
        )
    
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Remaining"] = str(100 - entry["count"])
    
    return response

# Iniciar tarea de limpieza
def start_cleanup():
    global cleanup_task
    if cleanup_task is None:
        cleanup_task = asyncio.create_task(cleanup_old_entries())
