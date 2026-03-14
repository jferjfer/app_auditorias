"""
Tarea automática para limpiar pedidos pendientes antiguos (>24 horas)
Ejecutar con cron o Task Scheduler cada hora
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime, timedelta
from backend.database import SessionLocal
from backend import models

def cleanup_old_pending_pedidos():
    db = SessionLocal()
    try:
        limite = datetime.utcnow() - timedelta(hours=24)
        
        pedidos_antiguos = db.query(models.PedidoUltimaMilla).filter(
            models.PedidoUltimaMilla.estado == 'pendiente',
            models.PedidoUltimaMilla.fecha_carga < limite
        ).all()
        
        count = len(pedidos_antiguos)
        pedido_ids = [p.id for p in pedidos_antiguos]
        
        if pedido_ids:
            db.query(models.ProductoPedidoUltimaMilla).filter(
                models.ProductoPedidoUltimaMilla.pedido_id.in_(pedido_ids)
            ).delete(synchronize_session=False)
            
            db.query(models.PedidoUltimaMilla).filter(
                models.PedidoUltimaMilla.id.in_(pedido_ids)
            ).delete(synchronize_session=False)
            
            db.commit()
            print(f"✅ {count} pedidos eliminados")
        else:
            print("ℹ️ No hay pedidos antiguos")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_pending_pedidos()
