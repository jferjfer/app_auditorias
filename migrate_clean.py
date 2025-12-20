"""
Script para LIMPIAR Vercel/Neon y migrar TODO desde Render
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = os.getenv("DATABASE_URL")

print("MIGRACION LIMPIA DE BASE DE DATOS")
print("Origen: Render")
print("Destino: Neon/Vercel\n")
print("ADVERTENCIA: Esto eliminara TODOS los datos en Vercel/Neon\n")

response = input("Continuar? (escribe SI): ")
if response != "SI":
    print("Cancelado")
    exit(0)

old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

TABLES = [
    'informes_generados',
    'archivos_auditoria',
    'product_history',
    'product_novelties',
    'productos_auditados',
    'audit_collaborators',
    'auditorias',
    'ubicaciones',
    'usuarios'
]

try:
    with new_engine.connect() as new_conn:
        print("\n1. LIMPIANDO base de datos destino...")
        for table in TABLES:
            try:
                new_conn.execute(text(f"DELETE FROM {table}"))
                print(f"  Limpiado: {table}")
            except Exception as e:
                print(f"  Error limpiando {table}: {e}")
        new_conn.commit()
    
    with old_engine.connect() as old_conn, new_engine.connect() as new_conn:
        print("\n2. MIGRANDO datos...")
        
        TABLES.reverse()
        
        for table in TABLES:
            print(f"\n  Tabla: {table}")
            
            result = old_conn.execute(text(f"SELECT * FROM {table}"))
            rows = result.fetchall()
            columns = result.keys()
            
            if not rows:
                print(f"    Vacia, omitiendo...")
                continue
            
            print(f"    {len(rows)} registros")
            
            placeholders = ', '.join([f':{col}' for col in columns])
            cols = ', '.join(columns)
            
            count = 0
            for row in rows:
                try:
                    data = dict(zip(columns, row))
                    new_conn.execute(text(f"""
                        INSERT INTO {table} ({cols})
                        VALUES ({placeholders})
                    """), data)
                    count += 1
                except Exception as e:
                    print(f"    Error: {e}")
            
            new_conn.commit()
            print(f"    Migrados: {count}")
        
        print("\n3. Actualizando secuencias...")
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
