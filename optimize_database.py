"""
Script para optimizar la base de datos con indices
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

print("OPTIMIZACION DE BASE DE DATOS")
print("Creando indices...\n")

engine = create_engine(DATABASE_URL)

indices = [
    ("idx_productos_auditoria", "CREATE INDEX IF NOT EXISTS idx_productos_auditoria ON productos_auditados(auditoria_id)"),
    ("idx_productos_sku", "CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos_auditados(sku)"),
    ("idx_productos_novedad", "CREATE INDEX IF NOT EXISTS idx_productos_novedad ON productos_auditados(novedad)"),
    ("idx_novelties_product", "CREATE INDEX IF NOT EXISTS idx_novelties_product ON product_novelties(product_id)"),
    ("idx_novelties_tipo", "CREATE INDEX IF NOT EXISTS idx_novelties_tipo ON product_novelties(novedad_tipo)"),
    ("idx_auditorias_auditor", "CREATE INDEX IF NOT EXISTS idx_auditorias_auditor ON auditorias(auditor_id)"),
    ("idx_auditorias_fecha", "CREATE INDEX IF NOT EXISTS idx_auditorias_fecha ON auditorias(creada_en DESC)"),
    ("idx_auditorias_estado", "CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON auditorias(estado)"),
    ("idx_history_product", "CREATE INDEX IF NOT EXISTS idx_history_product ON product_history(product_id)"),
    ("idx_collaborators_audit", "CREATE INDEX IF NOT EXISTS idx_collaborators_audit ON audit_collaborators(audit_id)"),
    ("idx_collaborators_user", "CREATE INDEX IF NOT EXISTS idx_collaborators_user ON audit_collaborators(user_id)"),
]

with engine.connect() as conn:
    for nombre, sql in indices:
        try:
            conn.execute(text(sql))
            print(f"OK: {nombre}")
        except Exception as e:
            print(f"Error {nombre}: {e}")
    
    conn.commit()

print("\nANALIZANDO TABLAS...")
tablas = ['auditorias', 'productos_auditados', 'product_novelties', 'usuarios', 'ubicaciones']

with engine.connect() as conn:
    for tabla in tablas:
        try:
            conn.execute(text(f"ANALYZE {tabla}"))
            print(f"OK: {tabla}")
        except Exception as e:
            print(f"Error {tabla}: {e}")
    
    conn.commit()

print("\nOPTIMIZACION COMPLETA!")
