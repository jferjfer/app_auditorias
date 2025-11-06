import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Pega aquí tu DATABASE_URL de Render
DATABASE_URL = input("Pega tu DATABASE_URL de Render: ").strip()

if not DATABASE_URL:
    print("ERROR: DATABASE_URL vacío")
    exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    # Contar auditorías
    result = session.execute(text("SELECT COUNT(*) FROM auditorias"))
    count = result.scalar()
    print(f"Auditorias encontradas: {count}")
    
    if count > 0:
        confirm = input(f"ADVERTENCIA: Eliminar {count} auditorias en cascada? (escribe 'SI'): ")
        if confirm == 'SI':
            # TRUNCATE elimina todo y reinicia IDs, CASCADE elimina dependencias
            session.execute(text("TRUNCATE TABLE auditorias CASCADE"))
            session.commit()
            print("EXITO: Todas las auditorias eliminadas en cascada")
        else:
            print("Cancelado")
    else:
        print("No hay auditorias")
except Exception as e:
    session.rollback()
    print(f"ERROR: {e}")
finally:
    session.close()
