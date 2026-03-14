"""add product novelties table

Revision ID: add_product_novelties
Revises: c0c3a4d3b2b1
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_product_novelties'
down_revision = 'add_product_history'
branch_labels = None
depends_on = None


def upgrade():
    # Usar el enum existente en lugar de crear uno nuevo
    from sqlalchemy.dialects.postgresql import ENUM
    novedad_enum = ENUM('sin_novedad', 'sobrante', 'faltante', 'averia', 'fecha_corta', 'contaminado', 'vencido', name='novedadenum', create_type=False)
    
    op.create_table(
        'product_novelties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('novedad_tipo', novedad_enum, nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('observaciones', sa.String(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['productos_auditados.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('product_novelties')
