import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# --- Configuración de la Base de Datos para Producción y Desarrollo ---

# Render y otros proveedores de nube establecen la variable de entorno DATABASE_URL.
# Si no existe, usamos la base de datos local SQLite para desarrollo.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auditorias.db")

# Render usa 'postgres://' pero SQLAlchemy prefiere 'postgresql://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# El motor de SQLAlchemy
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # connect_args es solo para SQLite
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

# Creación de la sesión de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos declarativos
Base = declarative_base()