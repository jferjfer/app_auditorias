"""
Crear usuario jose.vertel@laika.com.co
"""
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_engine(os.getenv("DATABASE_URL"))

password = "A1234567a"
hashed = pwd_context.hash(password)

with engine.connect() as conn:
    # Obtener el siguiente ID disponible
    result = conn.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios"))
    next_id = result.scalar()
    
    conn.execute(text("""
        INSERT INTO usuarios (id, nombre, correo, contrasena_hash, rol, creado_en)
        VALUES (:id, :nombre, :correo, :hash, :rol, NOW())
        ON CONFLICT (correo) DO UPDATE 
        SET contrasena_hash = EXCLUDED.contrasena_hash
    """), {
        'id': next_id,
        'nombre': 'Jose Vertel',
        'correo': 'jose.vertel@laika.com.co',
        'hash': hashed,
        'rol': 'administrador'
    })
    conn.commit()

print("Usuario creado/actualizado:")
print("Correo: jose.vertel@laika.com.co")
print("Contraseña: A1234567a")
print("Rol: administrador")
