"""
Crear nuevo usuario administrador
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import bcrypt

load_dotenv()

# BD Vercel/Neon
DB_URL = os.getenv("DATABASE_URL")

# Datos del nuevo administrador
NOMBRE = "Admin Principal"
CORREO = "admin@laika.com.co"
PASSWORD = "Admin2025"
ROL = "administrador"

print("Creando nuevo usuario administrador...\n")

# Hashear la contraseña
password_bytes = PASSWORD.encode('utf-8')
hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

engine = create_engine(DB_URL)

try:
    with engine.connect() as conn:
        # Verificar si el usuario ya existe
        result = conn.execute(text("""
            SELECT correo FROM usuarios WHERE correo = :correo
        """), {"correo": CORREO})
        
        if result.fetchone():
            print(f"El usuario {CORREO} ya existe. Actualizando contraseña...")
            conn.execute(text("""
                UPDATE usuarios 
                SET contrasena_hash = :hash, nombre = :nombre, rol = :rol
                WHERE correo = :correo
            """), {
                "hash": hashed,
                "nombre": NOMBRE,
                "rol": ROL,
                "correo": CORREO
            })
            print("Contraseña actualizada!")
        else:
            print(f"Creando nuevo usuario {CORREO}...")
            conn.execute(text("""
                INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, creado_en)
                VALUES (:nombre, :correo, :hash, :rol, NOW())
            """), {
                "nombre": NOMBRE,
                "correo": CORREO,
                "hash": hashed,
                "rol": ROL
            })
            print("Usuario creado!")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("CREDENCIALES DEL ADMINISTRADOR:")
        print("=" * 60)
        print(f"Correo:      {CORREO}")
        print(f"Contraseña:  {PASSWORD}")
        print(f"Rol:         {ROL}")
        print("=" * 60)
        
except Exception as e:
    print(f"Error: {e}")
