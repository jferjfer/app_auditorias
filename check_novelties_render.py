"""
Verificar novedades en Render
"""
from sqlalchemy import create_engine, text

RENDER_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"

engine = create_engine(RENDER_DB)

with engine.connect() as conn:
    # Contar novedades
    result = conn.execute(text("SELECT COUNT(*) FROM product_novelties"))
    total = result.scalar()
    print(f"Total novedades en Render: {total}\n")
    
    if total > 0:
        # Mostrar algunas
        result = conn.execute(text("""
            SELECT id, product_id, novedad_tipo, cantidad, observaciones
            FROM product_novelties
            LIMIT 10
        """))
        
        print("Primeras 10 novedades:")
        for row in result:
            print(f"  ID: {row[0]}, Producto: {row[1]}, Tipo: {row[2]}, Cant: {row[3]}")
