"""
Script para verificar productos en la base de datos
"""
from backend.database import SessionLocal
from backend import models

db = SessionLocal()

print("Verificando productos en la base de datos...\n")

# Obtener todas las auditorias
audits = db.query(models.Audit).all()

print(f"Total de auditorias: {len(audits)}\n")

for audit in audits:
    productos_count = db.query(models.Product).filter(
        models.Product.auditoria_id == audit.id
    ).count()
    
    status = "OK" if productos_count > 0 else "VACIO"
    print(f"[{status}] Auditoria #{audit.id} - {audit.estado} - {productos_count} productos")

print("\n" + "="*50)
total_productos = db.query(models.Product).count()
print(f"Total de productos en BD: {total_productos}")

db.close()
