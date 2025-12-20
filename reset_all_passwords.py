"""
Resetear contraseña de todos los usuarios a A1234567a
"""
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
NEW_DB = os.getenv("DATABASE_URL")
engine = create_engine(NEW_DB)

NEW_PASSWORD = "A1234567a"
hashed = pwd_context.hash(NEW_PASSWORD)

print("RESETEANDO CONTRASEÑAS\n")
print(f"Nueva contraseña: {NEW_PASSWORD}")
print(f"Hash: {hashed}\n")

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, correo, rol FROM usuarios"))
    users = result.fetchall()
    
    for user_id, correo, rol in users:
        conn.execute(text("""
            UPDATE usuarios 
            SET contrasena_hash = :hash 
            WHERE id = :id
        """), {'hash': hashed, 'id': user_id})
        print(f"Actualizado: {correo} ({rol})")
    
    conn.commit()

print(f"\nTODOS LOS {len(users)} USUARIOS ACTUALIZADOS")
print(f"Contraseña: {NEW_PASSWORD}")
