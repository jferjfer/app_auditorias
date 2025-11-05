#!/usr/bin/env python3
"""
Script para crear usuario administrador inicial en producción.
Uso: python create_admin.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

load_dotenv()

# Configuración
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    """Crea un usuario administrador inicial"""
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        from backend.models import User
        existing_admin = db.query(User).filter(User.rol == "administrador").first()
        
        if existing_admin:
            print(f"✅ Ya existe un administrador: {existing_admin.correo}")
            return
        
        # Solicitar datos
        print("\n🔐 Crear Usuario Administrador Inicial\n")
        nombre = input("Nombre completo: ").strip()
        correo = input("Correo electrónico: ").strip().lower()
        contrasena = input("Contraseña (mínimo 8 caracteres): ").strip()
        
        if len(contrasena) < 8:
            print("❌ Error: La contraseña debe tener al menos 8 caracteres")
            return
        
        # Crear usuario
        hashed_password = pwd_context.hash(contrasena)
        admin = User(
            nombre=nombre,
            correo=correo,
            contrasena_hash=hashed_password,
            rol="administrador"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✅ Administrador creado exitosamente!")
        print(f"   ID: {admin.id}")
        print(f"   Nombre: {admin.nombre}")
        print(f"   Correo: {admin.correo}")
        print(f"   Rol: {admin.rol}")
        print(f"\n🔑 Usa estas credenciales para iniciar sesión")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
