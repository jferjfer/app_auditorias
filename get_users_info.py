"""
Script para obtener información de usuarios de la BD de Vercel/Neon
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# BD Vercel/Neon
DB_URL = os.getenv("DATABASE_URL")

print("Consultando usuarios en BD de Vercel/Neon...\n")

engine = create_engine(DB_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, nombre, correo, rol, creado_en 
            FROM usuarios 
            ORDER BY id
        """))
        users = result.fetchall()
        
        print(f"Total de usuarios: {len(users)}\n")
        print("=" * 80)
        
        for user in users:
            print(f"\nUsuario #{user[0]}")
            print(f"   Nombre:   {user[1]}")
            print(f"   Correo:   {user[2]}")
            print(f"   Rol:      {user[3]}")
            print(f"   Creado:   {user[4]}")
            print("-" * 80)
        
        print("\n" + "=" * 80)
        print("\nCONTRASENAS (segun documentacion del proyecto):")
        print("\n   Todos los usuarios tienen la contrasena: password123")
        print("\n   Usuarios disponibles:")
        print("   - admin@auditorias.com    - Rol: administrador")
        print("   - auditor@auditorias.com  - Rol: auditor")
        print("   - analista@auditorias.com - Rol: analista")
        print("\n" + "=" * 80)
        
except Exception as e:
    print(f"Error: {e}")
