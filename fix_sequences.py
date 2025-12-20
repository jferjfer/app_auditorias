"""
Arreglar secuencias de IDs después de migración
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

tables = ['usuarios', 'ubicaciones', 'auditorias', 'productos_auditados', 
          'product_novelties', 'product_history', 'archivos_auditoria', 'informes_generados']

print("ARREGLANDO SECUENCIAS DE IDS\n")

with engine.connect() as conn:
    for table in tables:
        try:
            # Obtener el máximo ID actual
            result = conn.execute(text(f"SELECT MAX(id) FROM {table}"))
            max_id = result.scalar() or 0
            
            # Actualizar la secuencia
            conn.execute(text(f"""
                SELECT setval(pg_get_serial_sequence('{table}', 'id'), 
                GREATEST((SELECT MAX(id) FROM {table}), 1), true)
            """))
            
            print(f"{table:30} Max ID: {max_id:5} - Secuencia actualizada")
        except Exception as e:
            print(f"{table:30} Error: {e}")
    
    conn.commit()

print("\nSECUENCIAS ARREGLADAS!")
