import os
from sqlalchemy import create_engine, text

# Conectar a Neon
DATABASE_URL = "postgresql://neondb_owner:npg_pAf9Vc8QODjg@ep-blue-feather-a4jcgc5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Ver versión actual
    result = conn.execute(text("SELECT version_num FROM alembic_version"))
    current = result.fetchone()
    print(f"Versión actual: {current[0] if current else 'None'}")
    
    # Eliminar referencia incorrecta
    conn.execute(text("DELETE FROM alembic_version WHERE version_num = 'add_novedades_ultima_milla'"))
    
    # Establecer a la última migración válida
    conn.execute(text("DELETE FROM alembic_version"))
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('add_ultima_milla')"))
    conn.commit()
    
    print("OK: Alembic reseteado a 'add_ultima_milla'")
