"""
Mata todas las conexiones activas a la BD
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
NEW_DB = os.getenv("DATABASE_URL")
engine = create_engine(NEW_DB)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND pid <> pg_backend_pid()
    """))
    conn.commit()
    print("Conexiones cerradas")
