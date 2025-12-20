"""
Script para LIMPIAR Vercel/Neon y migrar TODO desde Render
TODOS los usuarios tendran contraseña: A1234567a
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
NEW_PASSWORD_HASH = pwd_context.hash("A1234567a")

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = os.getenv("DATABASE_URL")

print("MIGRACION LIMPIA CON RESET DE CONTRASEÑAS")
print("Origen: Render")
print("Destino: Neon/Vercel")
print("Nueva contraseña para TODOS: A1234567a\n")

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
        print("1. LIMPIANDO base de datos destino...")
        for table in TABLES:
            try:
                new_conn.execute(text(f"DELETE FROM {table}"))
                print(f"  Limpiado: {table}")
            except Exception as e:
                print(f"  Error: {e}")
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
                print(f"    Vacia")
                continue
            
            print(f"    {len(rows)} registros")
            
            placeholders = ', '.join([f':{col}' for col in columns])
            cols = ', '.join(columns)
            
            count = 0
            for row in rows:
                try:
                    data = dict(zip(columns, row))
                    
                    # Cambiar contraseña si es tabla usuarios
                    if table == 'usuarios':
                        data['contrasena_hash'] = NEW_PASSWORD_HASH
                    
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
        
    print("\nMIGRACION COMPLETA!")
    print("Todos los usuarios tienen contraseña: A1234567a")
    
except Exception as e:
    print(f"\nError: {e}")
    exit(1)
