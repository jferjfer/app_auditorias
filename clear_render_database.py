# -*- coding: utf-8 -*-
"""
Script para vaciar tabla de auditorias en Render (produccion)
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend import models

# URL de la BD de Render (desde variable de entorno o manual)
DATABASE_URL = (os.getenv("DATABASE_URL") or input("Ingresa DATABASE_URL de Render: ")).strip()

# Crear engine y session
print(f"Conectando a: {DATABASE_URL[:50]}...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def clear_all_audits():
    db = SessionLocal()
    try:
        count = db.query(models.Audit).count()
        print(f"Auditorias encontradas: {count}")
        
        # Eliminar en orden por dependencias
        from backend.models import ProductHistory, ProductNovelty, Product, File
        db.query(ProductHistory).delete()
        db.query(ProductNovelty).delete()
        db.query(Product).delete()
        db.query(File).delete()
        db.execute(text("DELETE FROM audit_collaborators"))
        db.query(models.Audit).delete()
        
        # Reiniciar secuencia de ID a 1
        db.execute(text("ALTER SEQUENCE auditorias_id_seq RESTART WITH 1"))
        
        db.commit()
        print("OK: Tabla de auditorias vaciada y secuencia reiniciada a 1")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--confirm":
        clear_all_audits()
    else:
        confirm = input("ADVERTENCIA: Vaciar auditorias en PRODUCCION (Render)? (escribe 'SI'): ")
        if confirm == "SI":
            clear_all_audits()
        else:
            print("Operacion cancelada")
