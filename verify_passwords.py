"""
Verificar hashes de contraseñas en la nueva BD
"""
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
NEW_DB = os.getenv("DATABASE_URL")
engine = create_engine(NEW_DB)

print("VERIFICANDO HASHES DE CONTRASEÑAS\n")

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, nombre, correo, contrasena_hash, rol 
        FROM usuarios 
        ORDER BY rol, id
    """))
    users = result.fetchall()
    
    print(f"Total usuarios: {len(users)}\n")
    
    for user in users:
        user_id, nombre, correo, hash_pwd, rol = user
        
        # Verificar que el hash tiene formato bcrypt correcto
        is_valid_bcrypt = hash_pwd.startswith('$2b$') and len(hash_pwd) == 60
        
        print(f"ID: {user_id}")
        print(f"Nombre: {nombre}")
        print(f"Correo: {correo}")
        print(f"Rol: {rol}")
        print(f"Hash: {hash_pwd[:20]}...")
        print(f"Formato bcrypt valido: {'SI' if is_valid_bcrypt else 'NO'}")
        print("-" * 50)

print("\nPara probar login, usa estos usuarios:")
print("Auditor: (busca un correo con rol 'auditor')")
print("Analista: (busca un correo con rol 'analista')")
print("Admin: (busca un correo con rol 'administrador')")
