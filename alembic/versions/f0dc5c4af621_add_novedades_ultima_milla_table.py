"""add novedades ultima milla table

Revision ID: f0dc5c4af621
Revises: add_ultima_milla
Create Date: 2026-02-03 09:01:57.263144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0dc5c4af621'
down_revision: Union[str, None] = 'add_ultima_milla'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'novedades_producto_ultima_milla',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('producto_id', sa.Integer(), nullable=False),
        sa.Column('tipo_novedad', sa.String(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('observaciones', sa.String(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['producto_id'], ['productos_pedido_ultima_milla.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_novedades_producto_ultima_milla', 'novedades_producto_ultima_milla', ['producto_id'])
    op.create_index('idx_novedades_tipo_ultima_milla', 'novedades_producto_ultima_milla', ['tipo_novedad'])


def downgrade() -> None:
    op.drop_index('idx_novedades_tipo_ultima_milla', table_name='novedades_producto_ultima_milla')
    op.drop_index('idx_novedades_producto_ultima_milla', table_name='novedades_producto_ultima_milla')
    op.drop_table('novedades_producto_ultima_milla')
