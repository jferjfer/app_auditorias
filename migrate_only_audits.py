"""
Script para migrar SOLO auditorias y productos desde Render
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = os.getenv("DATABASE_URL")

print("MIGRACION DE AUDITORIAS Y PRODUCTOS")
print("Origen: Render")
print("Destino: Neon/Vercel\n")

old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

try:
    with new_engine.connect() as new_conn:
        print("1. Limpiando auditorias y productos existentes...")
        new_conn.execute(text("DELETE FROM product_history"))
        new_conn.execute(text("DELETE FROM product_novelties"))
        new_conn.execute(text("DELETE FROM productos_auditados"))
        new_conn.execute(text("DELETE FROM audit_collaborators"))
        new_conn.execute(text("DELETE FROM archivos_auditoria"))
        new_conn.execute(text("DELETE FROM auditorias"))
        new_conn.commit()
        print("   Limpiado\n")
    
    with old_engine.connect() as old_conn, new_engine.connect() as new_conn:
        
        # Migrar auditorias
        print("2. Migrando auditorias...")
        result = old_conn.execute(text("SELECT * FROM auditorias"))
        rows = result.fetchall()
        columns = result.keys()
        
        print(f"   {len(rows)} auditorias encontradas")
        
        placeholders = ', '.join([f':{col}' for col in columns])
        cols = ', '.join(columns)
        
        count = 0
        for row in rows:
            try:
                data = dict(zip(columns, row))
                new_conn.execute(text(f"""
                    INSERT INTO auditorias ({cols})
                    VALUES ({placeholders})
                """), data)
                count += 1
            except Exception as e:
                print(f"   Error: {e}")
        
        new_conn.commit()
        print(f"   Migradas: {count}\n")
        
        # Migrar productos
        print("3. Migrando productos...")
        result = old_conn.execute(text("SELECT * FROM productos_auditados"))
        rows = result.fetchall()
        columns = result.keys()
        
        print(f"   {len(rows)} productos encontrados")
        
        placeholders = ', '.join([f':{col}' for col in columns])
        cols = ', '.join(columns)
        
        count = 0
        for row in rows:
            try:
                data = dict(zip(columns, row))
                new_conn.execute(text(f"""
                    INSERT INTO productos_auditados ({cols})
                    VALUES ({placeholders})
                """), data)
                count += 1
            except Exception as e:
                print(f"   Error: {e}")
        
        new_conn.commit()
        print(f"   Migrados: {count}\n")
        
        # Migrar colaboradores
        print("4. Migrando colaboradores...")
        result = old_conn.execute(text("SELECT * FROM audit_collaborators"))
        rows = result.fetchall()
        
        if rows:
            print(f"   {len(rows)} relaciones")
            for row in rows:
                try:
                    new_conn.execute(text("""
                        INSERT INTO audit_collaborators (user_id, audit_id)
                        VALUES (:user_id, :audit_id)
                    """), {"user_id": row[0], "audit_id": row[1]})
                except:
                    pass
            new_conn.commit()
        
        # Actualizar secuencias
        print("\n5. Actualizando secuencias...")
        new_conn.execute(text("""
            SELECT setval(pg_get_serial_sequence('auditorias', 'id'), 
            COALESCE((SELECT MAX(id) FROM auditorias), 1), true)
        """))
        new_conn.execute(text("""
            SELECT setval(pg_get_serial_sequence('productos_auditados', 'id'), 
            COALESCE((SELECT MAX(id) FROM productos_auditados), 1), true)
        """))
        new_conn.commit()
        
    print("\nMIGRACION COMPLETA!")
    
except Exception as e:
    print(f"\nError: {e}")
    exit(1)
