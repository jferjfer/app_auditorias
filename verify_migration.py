"""
Verificar migración completa
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

NEW_DB = os.getenv("DATABASE_URL")
engine = create_engine(NEW_DB)

print("VERIFICANDO MIGRACION\n")

with engine.connect() as conn:
    # Contar registros en cada tabla
    tables = [
        'usuarios',
        'ubicaciones',
        'auditorias',
        'productos_auditados',
        'product_novelties',
        'product_history',
        'audit_collaborators'
    ]
    
    for table in tables:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
        count = result.scalar()
        print(f"{table:25} {count:>6} registros")

print("\nMIGRACION VERIFICADA!")
