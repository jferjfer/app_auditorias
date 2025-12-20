"""
Script para verificar productos en Vercel/Neon
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Conectando a: {DATABASE_URL[:50]}...\n")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Contar auditorias
    result = conn.execute(text("SELECT COUNT(*) FROM auditorias"))
    total_audits = result.scalar()
    print(f"Total de auditorias: {total_audits}\n")
    
    # Obtener auditorias con conteo de productos
    result = conn.execute(text("""
        SELECT a.id, a.estado, COUNT(p.id) as productos_count
        FROM auditorias a
        LEFT JOIN productos_auditados p ON p.auditoria_id = a.id
        GROUP BY a.id, a.estado
        ORDER BY a.id DESC
        LIMIT 20
    """))
    
    for row in result:
        status = "OK" if row[2] > 0 else "VACIO"
        print(f"[{status}] Auditoria #{row[0]} - {row[1]} - {row[2]} productos")
    
    # Total de productos
    result = conn.execute(text("SELECT COUNT(*) FROM productos_auditados"))
    total_productos = result.scalar()
    print(f"\n{'='*50}")
    print(f"Total de productos en BD: {total_productos}")
