"""
Corregir migración: eliminar usuarios de prueba y migrar correctamente
"""
from sqlalchemy import create_engine, text

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = "postgresql://neondb_owner:npg_pAf9Vc8QODjg@ep-blue-feather-a4jcgc5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

print("CORRIGIENDO MIGRACION\n")

with new_engine.connect() as conn:
    # Eliminar usuarios de prueba
    print("1. Eliminando usuarios de prueba...")
    conn.execute(text("DELETE FROM usuarios WHERE correo IN ('felipe@laika.com.co', 'carlos@laika.com.co')"))
    print("   Eliminados: felipe, carlos")
    
    # Obtener usuarios de BD antigua
    with old_engine.connect() as old_conn:
        result = old_conn.execute(text("SELECT id, nombre, correo, contrasena_hash, rol, creado_en FROM usuarios"))
        old_users = result.fetchall()
    
    print(f"\n2. Migrando {len(old_users)} usuarios de BD antigua...")
    for user in old_users:
        conn.execute(text("""
            INSERT INTO usuarios (id, nombre, correo, contrasena_hash, rol, creado_en)
            VALUES (:id, :nombre, :correo, :hash, :rol, :creado_en)
            ON CONFLICT (id) DO UPDATE 
            SET nombre = EXCLUDED.nombre,
                correo = EXCLUDED.correo,
                contrasena_hash = EXCLUDED.contrasena_hash,
                rol = EXCLUDED.rol
        """), {
            'id': user[0],
            'nombre': user[1],
            'correo': user[2],
            'hash': user[3],
            'rol': user[4],
            'creado_en': user[5]
        })
        print(f"   {user[2]} ({user[4]})")
    
    conn.commit()

print("\nMIGRACION CORREGIDA!")
print("Ahora jose.vertel@laika.com.co deberia funcionar")
