import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# La aplicación en producción SIEMPRE usará esta variable de entorno.
# Para desarrollo local, deberás configurar esta variable en tu terminal
# o usar las herramientas de tu editor de código (como el launch.json de VSCode).
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Crea el motor de la base de datos
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Configura la sesión de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()