"""
Verificar estructura de novedades en Render
"""
from sqlalchemy import create_engine, text

RENDER_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"

engine = create_engine(RENDER_DB)

with engine.connect() as conn:
    print("=== PRODUCTOS_AUDITADOS ===")
    result = conn.execute(text("""
        SELECT novedad, COUNT(*) 
        FROM productos_auditados 
        GROUP BY novedad
    """))
    for row in result:
        print(f"  {row[0]}: {row[1]}")
    
    print("\n=== PRODUCT_NOVELTIES ===")
    result = conn.execute(text("""
        SELECT novedad_tipo, COUNT(*) 
        FROM product_novelties 
        GROUP BY novedad_tipo
    """))
    for row in result:
        print(f"  {row[0]}: {row[1]}")
