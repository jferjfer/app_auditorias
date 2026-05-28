"""add composite index to auditorias

Revision ID: 5695c9fc563a
Revises: 
Create Date: 2026-04-08

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5695c9fc563a'
down_revision: Union[str, None] = 'make_novedad_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('idx_auditorias_compuesto', 'auditorias', ['creada_en', 'estado', 'auditor_id', 'ubicacion_origen_id'], unique=False, if_not_exists=True)


def downgrade() -> None:
    op.drop_index('idx_auditorias_compuesto', table_name='auditorias')
