import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, nombre, correo, rol, contrasena_hash, creado_en 
        FROM usuarios 
        WHERE rol = 'administrador'
        ORDER BY id
    """))
    
    print("\n" + "="*80)
    print("USUARIOS ADMINISTRADORES")
    print("="*80 + "\n")
    
    for row in result:
        print(f"ID: {row.id}")
        print(f"Nombre: {row.nombre}")
        print(f"Correo: {row.correo}")
        print(f"Rol: {row.rol}")
        print(f"Contraseña Hash: {row.contrasena_hash}")
        print(f"Creado: {row.creado_en}")
        print("-" * 80)
