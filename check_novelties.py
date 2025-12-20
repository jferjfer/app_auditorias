"""
Verificar que las novedades se guardan en ambas tablas
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

print("VERIFICANDO NOVEDADES EN BD\n")

with engine.connect() as conn:
    # Novedades en productos_auditados
    result = conn.execute(text("""
        SELECT novedad, COUNT(*) 
        FROM productos_auditados 
        GROUP BY novedad
    """))
    print("Tabla productos_auditados (campo novedad):")
    for row in result:
        print(f"  {row[0]:20} {row[1]:5} productos")
    
    # Novedades en product_novelties
    result = conn.execute(text("""
        SELECT novedad_tipo, COUNT(*) 
        FROM product_novelties 
        GROUP BY novedad_tipo
    """))
    print("\nTabla product_novelties (novedades multiples):")
    total = 0
    for row in result:
        print(f"  {row[0]:20} {row[1]:5} registros")
        total += row[1]
    
    if total == 0:
        print("  (VACIA - No hay novedades registradas)")
    
    print(f"\nTotal novedades multiples: {total}")
