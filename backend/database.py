import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# --- Configuracion de la Base de Datos para Produccion y Desarrollo ---

# Render y otros proveedores de nube establecen la variable de entorno DATABASE_URL.
# Si no existe, usamos la base de datos local SQLite pa desarrollo.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auditorias.db")

# Render usa 'postgres://' pero SQLAlchemy prefiere 'postgresql://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# El motor de SQLAlchemy con configuracion de pool pa PostgreSQL
if "postgresql" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Verifica conexiones antes de usarlas
        pool_recycle=3600,   # Recicla conexiones cada hora
        connect_args={"connect_timeout": 10}  # Timeout de 10 segundos
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# Creacion de la sesion de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pa los modelos declarativos
Base = declarative_base()