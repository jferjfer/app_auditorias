import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_pAf9Vc8QODjg@ep-blue-feather-a4jcgc5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT version_num FROM alembic_version"))
    current = result.fetchone()
    print(f"Version actual: {current[0] if current else 'None'}")
    
    # Marcar f0dc5c4af621 como aplicada sin ejecutarla
    conn.execute(text("DELETE FROM alembic_version"))
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('f0dc5c4af621')"))
    conn.commit()
    
    print("OK: Alembic actualizado a 'f0dc5c4af621'")
