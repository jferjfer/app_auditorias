"""
Script para verificar contraseñas de usuarios
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

# BD Vercel/Neon
DB_URL = os.getenv("DATABASE_URL")

# Configurar bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("Verificando contraseñas en BD de Vercel/Neon...\n")

engine = create_engine(DB_URL)

# Contraseñas comunes a probar
passwords_to_test = [
    "password123",
    "Password123",
    "123456",
    "admin123",
    "laika123",
    "Laika123"
]

try:
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, nombre, correo, contrasena_hash, rol 
            FROM usuarios 
            ORDER BY id
            LIMIT 5
        """))
        users = result.fetchall()
        
        print(f"Probando contraseñas para los primeros 5 usuarios:\n")
        print("=" * 80)
        
        for user in users:
            user_id, nombre, correo, hash_pwd, rol = user
            print(f"\nUsuario: {correo} ({rol})")
            print(f"Hash: {hash_pwd[:50]}...")
            
            # Probar cada contraseña
            for pwd in passwords_to_test:
                try:
                    if pwd_context.verify(pwd, hash_pwd):
                        print(f"   >>> CONTRASEÑA ENCONTRADA: {pwd}")
                        break
                except:
                    pass
            else:
                print(f"   >>> Ninguna contraseña comun funciona")
            
            print("-" * 80)
        
except Exception as e:
    print(f"Error: {e}")
