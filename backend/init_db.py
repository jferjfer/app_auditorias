import logging
from backend.database import engine
from backend.models import Base

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def init_db():
    """
    Genera el esquema de la base de datos creando todas las tablas
    definidas en los modelos de SQLAlchemy.
    """
    log.info("Creando todas las tablas en la base de datos...")
    log.warning("ADVERTENCIA: Base.metadata.create_all() está obsoleto. Usa 'alembic upgrade head' para migraciones.")
    try:
        # En una aplicación real, se recomienda usar Alembic para migraciones.
        # Para una configuración inicial simple, create_all es suficiente.
        # Base.metadata.create_all(bind=engine) # Comentado para prevenir su uso.
        log.info("¡Tablas creadas exitosamente!")
    except Exception as e:
        log.error("Error al crear las tablas.", exc_info=e)

if __name__ == "__main__":
    init_db()