"""Create auditorias table

Revision ID: 94d7d8e474fa
Revises: 
Create Date: 2025-09-23 18:00:02.356043

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('auditorias',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('auditor_id', sa.Integer(), nullable=True),
    sa.Column('ubicacion_destino', sa.String(length=100), nullable=False),
    sa.Column('estado', sa.String(length=20), server_default='en_progreso', nullable=True),
    sa.Column('porcentaje_cumplimiento', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('creada_en', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.alter_column('auditorias', 'id', server_default=sa.text("nextval('auditorias_id_seq')"))


def downgrade() -> None:
    op.drop_table('auditorias')
    op.execute(sa.schema.DropSequence(sa.Sequence('auditorias_id_seq')))

