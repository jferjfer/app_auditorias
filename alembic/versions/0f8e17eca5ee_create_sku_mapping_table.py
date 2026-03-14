"""create_sku_mapping_table

Revision ID: 0f8e17eca5ee
Revises: add_no_salio_novelty
Create Date: 2026-01-26 21:35:50.314205

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f8e17eca5ee'
down_revision: Union[str, None] = 'add_no_salio_novelty'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'sku_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku_antiguo', sa.String(), nullable=False),
        sa.Column('sku_nuevo', sa.String(), nullable=False),
        sa.Column('creado_por', sa.Integer(), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('activo', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.ForeignKeyConstraint(['creado_por'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku_antiguo')
    )
    op.create_index('idx_sku_mapping_antiguo', 'sku_mapping', ['sku_antiguo'])
    op.create_index('idx_sku_mapping_nuevo', 'sku_mapping', ['sku_nuevo'])
    op.create_index('idx_sku_mapping_activo', 'sku_mapping', ['activo'])


def downgrade() -> None:
    op.drop_index('idx_sku_mapping_activo', table_name='sku_mapping')
    op.drop_index('idx_sku_mapping_nuevo', table_name='sku_mapping')
    op.drop_index('idx_sku_mapping_antiguo', table_name='sku_mapping')
    op.drop_table('sku_mapping')
