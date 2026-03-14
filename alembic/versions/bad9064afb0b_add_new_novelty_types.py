"""add new novelty types

Revision ID: bad9064afb0b
Revises: 6afe7d896f2a
Create Date: 2025-10-02 21:56:33.584647

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'bad9064afb0b'
down_revision: Union[str, None] = '6afe7d896f2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

novedad_enum = postgresql.ENUM('sin_novedad', 'sobrante', 'faltante', 'averia', 'fecha_corta', 'contaminado', 'vencido', name='novedadenum')

def upgrade() -> None:
    novedad_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column('productos_auditados', 'novedad',
               existing_type=sa.VARCHAR(),
               type_=novedad_enum,
               existing_nullable=True,
               postgresql_using='novedad::novedadenum')


def downgrade() -> None:
    op.alter_column('productos_auditados', 'novedad',
               existing_type=novedad_enum,
               type_=sa.VARCHAR(),
               existing_nullable=False)
    novedad_enum.drop(op.get_bind())