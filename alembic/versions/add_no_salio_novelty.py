"""add no_salio novelty type

Revision ID: add_no_salio_novelty
Revises: c0c3a4d3b2b1
Create Date: 2025-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_no_salio_novelty'
down_revision: Union[str, None] = 'a6097efa3864'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar el nuevo valor 'no_salio' al enum existente
    op.execute("ALTER TYPE novedadenum ADD VALUE IF NOT EXISTS 'no_salio'")


def downgrade() -> None:
    # No se puede eliminar un valor de un enum en PostgreSQL fácilmente
    # Se requeriría recrear el enum completo
    pass
