#!/usr/bin/env python3
"""Script para crear usuario Diana Rojas"""

from backend.database import SessionLocal
from backend.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Verificar si existe
existing = db.query(User).filter(User.correo == 'diana.rojas@laika.com.co').first()
if existing:
    print(f"Usuario ya existe: {existing.nombre} (ID: {existing.id})")
else:
    # Crear usuario
    hashed = pwd_context.hash('A1234567a')
    user = User(
        nombre='Diana Rojas',
        correo='diana.rojas@laika.com.co',
        contrasena_hash=hashed,
        rol='auditor'
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Usuario creado: {user.nombre} (ID: {user.id}, Rol: {user.rol})")

db.close()
