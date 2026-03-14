"""add ultima milla tables

Revision ID: add_ultima_milla
Revises: 0f8e17eca5ee
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_ultima_milla'
down_revision = '0f8e17eca5ee'
branch_labels = None
depends_on = None


def upgrade():
    # Crear tabla pedidos_ultima_milla
    op.create_table(
        'pedidos_ultima_milla',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bodega', sa.String(), nullable=False),
        sa.Column('documento_domiciliario', sa.String(), nullable=False),
        sa.Column('nombre_domiciliario', sa.String(), nullable=False),
        sa.Column('numero_pedido', sa.String(), nullable=False),
        sa.Column('estado', sa.String(), nullable=False, server_default='pendiente'),
        sa.Column('fecha_carga', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('auditoria_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['auditoria_id'], ['auditorias.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_pedido')
    )
    op.create_index('idx_pedidos_bodega', 'pedidos_ultima_milla', ['bodega'])
    op.create_index('idx_pedidos_domiciliario', 'pedidos_ultima_milla', ['documento_domiciliario'])
    op.create_index('idx_pedidos_estado', 'pedidos_ultima_milla', ['estado'])
    
    # Crear tabla productos_pedido_ultima_milla
    op.create_table(
        'productos_pedido_ultima_milla',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(), nullable=False),
        sa.Column('descripcion', sa.String(), nullable=False),
        sa.Column('gramaje', sa.String(), nullable=True),
        sa.Column('cantidad_pedida', sa.Integer(), nullable=False),
        sa.Column('cantidad_fisica', sa.Integer(), nullable=True),
        sa.Column('novedad', sa.String(), nullable=False, server_default='sin_novedad'),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('auditado_por', sa.Integer(), nullable=True),
        sa.Column('auditado_en', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedidos_ultima_milla.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['auditado_por'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_productos_pedido', 'productos_pedido_ultima_milla', ['pedido_id'])
    op.create_index('idx_productos_pedido_sku', 'productos_pedido_ultima_milla', ['sku'])


def downgrade():
    op.drop_index('idx_productos_pedido_sku', table_name='productos_pedido_ultima_milla')
    op.drop_index('idx_productos_pedido', table_name='productos_pedido_ultima_milla')
    op.drop_table('productos_pedido_ultima_milla')
    
    op.drop_index('idx_pedidos_estado', table_name='pedidos_ultima_milla')
    op.drop_index('idx_pedidos_domiciliario', table_name='pedidos_ultima_milla')
    op.drop_index('idx_pedidos_bodega', table_name='pedidos_ultima_milla')
    op.drop_table('pedidos_ultima_milla')
