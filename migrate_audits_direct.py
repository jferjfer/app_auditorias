"""
Migrar auditorias y productos de Render a Vercel/Neon (directo)
"""
from sqlalchemy import create_engine, text

RENDER_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
VERCEL_DB = "postgresql://neondb_owner:npg_pAf9Vc8QODjg@ep-blue-feather-a4jcgc5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

print("MIGRACION DIRECTA")
print("Render -> Vercel/Neon\n")

render = create_engine(RENDER_DB)
vercel = create_engine(VERCEL_DB)

try:
    with vercel.connect() as v_conn:
        print("1. Limpiando Vercel...")
        v_conn.execute(text("TRUNCATE TABLE auditorias CASCADE"))
        v_conn.commit()
        print("   OK\n")
    
    with render.connect() as r_conn, vercel.connect() as v_conn:
        
        # Auditorias
        print("2. Migrando auditorias...")
        result = r_conn.execute(text("SELECT * FROM auditorias"))
        rows = result.fetchall()
        cols = result.keys()
        
        print(f"   {len(rows)} auditorias")
        
        ph = ', '.join([f':{c}' for c in cols])
        cs = ', '.join(cols)
        
        for row in rows:
            data = dict(zip(cols, row))
            v_conn.execute(text(f"INSERT INTO auditorias ({cs}) VALUES ({ph})"), data)
        
        v_conn.commit()
        print("   OK\n")
        
        # Productos
        print("3. Migrando productos...")
        result = r_conn.execute(text("SELECT * FROM productos_auditados"))
        rows = result.fetchall()
        cols = result.keys()
        
        print(f"   {len(rows)} productos")
        
        ph = ', '.join([f':{c}' for c in cols])
        cs = ', '.join(cols)
        
        for i, row in enumerate(rows):
            data = dict(zip(cols, row))
            v_conn.execute(text(f"INSERT INTO productos_auditados ({cs}) VALUES ({ph})"), data)
            if (i+1) % 500 == 0:
                print(f"   {i+1}/{len(rows)}")
        
        v_conn.commit()
        print("   OK\n")
        
        # Novedades
        print("4. Migrando novedades...")
        result = r_conn.execute(text("SELECT * FROM product_novelties"))
        rows = result.fetchall()
        
        if rows:
            cols = result.keys()
            print(f"   {len(rows)} novedades")
            
            ph = ', '.join([f':{c}' for c in cols])
            cs = ', '.join(cols)
            
            for row in rows:
                data = dict(zip(cols, row))
                v_conn.execute(text(f"INSERT INTO product_novelties ({cs}) VALUES ({ph})"), data)
            
            v_conn.commit()
            print("   OK\n")
        
        # Colaboradores
        print("5. Migrando colaboradores...")
        result = r_conn.execute(text("SELECT * FROM audit_collaborators"))
        rows = result.fetchall()
        
        if rows:
            print(f"   {len(rows)} relaciones")
            for row in rows:
                v_conn.execute(text("INSERT INTO audit_collaborators (user_id, audit_id) VALUES (:u, :a)"), 
                             {"u": row[0], "a": row[1]})
            v_conn.commit()
            print("   OK\n")
        
        # Secuencias
        print("6. Actualizando secuencias...")
        v_conn.execute(text("SELECT setval(pg_get_serial_sequence('auditorias', 'id'), COALESCE((SELECT MAX(id) FROM auditorias), 1), true)"))
        v_conn.execute(text("SELECT setval(pg_get_serial_sequence('productos_auditados', 'id'), COALESCE((SELECT MAX(id) FROM productos_auditados), 1), true)"))
        v_conn.execute(text("SELECT setval(pg_get_serial_sequence('product_novelties', 'id'), COALESCE((SELECT MAX(id) FROM product_novelties), 1), true)"))
        v_conn.commit()
        print("   OK\n")
        
    print("MIGRACION COMPLETA!")
    
except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
