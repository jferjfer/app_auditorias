"""
Script para migrar usuarios de BD antigua a BD nueva (Neon/Vercel)
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# BD antigua (Render)
OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"

# BD nueva (Neon/Vercel)
NEW_DB = os.getenv("DATABASE_URL")

print("🔄 Iniciando migración de usuarios...")
print(f"📤 Origen: Render")
print(f"📥 Destino: Neon/Vercel")

# Conectar a ambas BDs
old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

try:
    # 1. Verificar estructura en nueva BD
    print("\n1️⃣ Verificando estructura de nueva BD...")
    with new_engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result]
        
        if 'usuarios' not in tables:
            print("❌ La tabla 'usuarios' no existe en la nueva BD")
            print("📋 Tablas encontradas:", tables)
            print("\n⚠️  Primero ejecuta: alembic upgrade head")
            exit(1)
        
        print("✅ Estructura correcta encontrada")
    
    # 2. Extraer usuarios de BD antigua
    print("\n2️⃣ Extrayendo usuarios de BD antigua...")
    with old_engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre, correo, contrasena_hash, rol, creado_en FROM usuarios"))
        users = result.fetchall()
        print(f"✅ Encontrados {len(users)} usuarios")
    
    # 3. Insertar en nueva BD
    print("\n3️⃣ Insertando usuarios en nueva BD...")
    with new_engine.connect() as conn:
        for user in users:
            try:
                conn.execute(text("""
                    INSERT INTO usuarios (id, nombre, correo, contrasena_hash, rol, creado_en)
                    VALUES (:id, :nombre, :correo, :contrasena_hash, :rol, :creado_en)
                    ON CONFLICT (correo) DO NOTHING
                """), {
                    'id': user[0],
                    'nombre': user[1],
                    'correo': user[2],
                    'contrasena_hash': user[3],
                    'rol': user[4],
                    'creado_en': user[5]
                })
                print(f"  ✅ {user[2]} ({user[4]})")
            except Exception as e:
                print(f"  ⚠️  Error con {user[2]}: {e}")
        
        conn.commit()
    
    print("\n✅ Migración completada exitosamente!")
    print("\n📊 Resumen:")
    print(f"   Total usuarios migrados: {len(users)}")
    
except Exception as e:
    print(f"\n❌ Error durante la migración: {e}")
    exit(1)
