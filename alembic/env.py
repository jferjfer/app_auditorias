import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- INICIO DE MODIFICACIONES ---
# Añadir la raíz del proyecto al path para que Python encuentre los módulos del backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Obtener la URL de la base de datos directamente del entorno para compatibilidad con Render
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback para desarrollo local si la variable no está seteada
    from backend.database import SQLALCHEMY_DATABASE_URL
    DATABASE_URL = SQLALCHEMY_DATABASE_URL

from backend.models import Base
# --- FIN DE MODIFICACIONES ---

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# --- INICIO DE MODIFICACIONES ---
target_metadata = Base.metadata
# --- FIN DE MODIFICACIONES ---



# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # --- INICIO DE MODIFICACIONES ---
    # url = config.get_main_option("sqlalchemy.url")
    # --- INICIO DE MODIFICACIONES ---
# Añadir la raíz del proyecto al path para que Python encuentre los módulos del backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importar la URL de la base de datos y los modelos desde el backend
from backend.database import SQLALCHEMY_DATABASE_URL
from backend.models import Base
# --- FIN DE MODIFICACIONES ---

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Asignar la URL de la base de datos a la configuración de Alembic
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)
    # --- FIN DE MODIFICACIONES ---
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # --- INICIO DE MODIFICACIONES ---
    config.set_main_option('sqlalchemy.url', SQLALCHEMY_DATABASE_URL)
    # --- FIN DE MODIFICACIONES ---
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
