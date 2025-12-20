"""
Script para migrar TODA la BD de Render a Neon/Vercel
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = os.getenv("DATABASE_URL")

print("MIGRACION COMPLETA DE BASE DE DATOS")
print("Origen: Render")
print("Destino: Neon/Vercel\n")

old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

# Orden de migración (respetando foreign keys)
TABLES = [
    'usuarios',
    'ubicaciones',
    'auditorias',
    'audit_collaborators',
    'productos_auditados',
    'product_novelties',
    'product_history',
    'archivos_auditoria',
    'informes_generados'
]

try:
    with old_engine.connect() as old_conn, new_engine.connect() as new_conn:
        
        for table in TABLES:
            print(f"\nMigrando tabla: {table}")
            
            # Obtener datos
            result = old_conn.execute(text(f"SELECT * FROM {table}"))
            rows = result.fetchall()
            columns = result.keys()
            
            if not rows:
                print(f"  Tabla vacia, omitiendo...")
                continue
            
            print(f"  {len(rows)} registros encontrados")
            
            # Insertar datos
            placeholders = ', '.join([f':{col}' for col in columns])
            cols = ', '.join(columns)
            
            for row in rows:
                try:
                    data = dict(zip(columns, row))
                    new_conn.execute(text(f"""
                        INSERT INTO {table} ({cols})
                        VALUES ({placeholders})
                        ON CONFLICT DO NOTHING
                    """), data)
                except Exception as e:
                    print(f"  Error en registro: {e}")
            
            new_conn.commit()
            print(f"  Completado")
        
        # Actualizar secuencias
        print("\nActualizando secuencias...")
        for table in TABLES:
            try:
                new_conn.execute(text(f"""
                    SELECT setval(pg_get_serial_sequence('{table}', 'id'), 
                    COALESCE((SELECT MAX(id) FROM {table}), 1), true)
                """))
            except:
                pass
        new_conn.commit()
        
    print("\nMIGRACION COMPLETA EXITOSA!")
    
except Exception as e:
    print(f"\nError: {e}")
    exit(1)
