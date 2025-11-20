# -*- coding: utf-8 -*-
"""
Script para vaciar todas las tablas de auditorias en cascada
"""
from backend.database import SessionLocal, engine
from backend import models

def clear_all_audits():
    db = SessionLocal()
    try:
        # Eliminar solo auditorias (cascada automatica por FK)
        db.query(models.Audit).delete()
        db.commit()
        print("OK: Tabla de auditorias vaciada (cascada automatica)")
        
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
        confirm = input("Vaciar tabla auditorias? (escribe 'SI'): ")
        if confirm == "SI":
            clear_all_audits()
        else:
            print("Operacion cancelada")
