"""add_ubicaciones_table

Revision ID: 06d5cac4169b
Revises: 52e304170c8b
Create Date: 2025-11-13 17:29:39.738140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06d5cac4169b'
down_revision: Union[str, None] = '52e304170c8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla ubicaciones
    op.create_table(
        'ubicaciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('tipo', sa.String(), nullable=False),
        sa.Column('creado_por', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Agregar columna ubicacion_origen_id a auditorias
    op.add_column('auditorias', sa.Column('ubicacion_origen_id', sa.Integer(), sa.ForeignKey('ubicaciones.id'), nullable=True))
    
    # Migrar datos existentes: crear ubicaciones desde ubicacion_destino
    op.execute("""
        INSERT INTO ubicaciones (nombre, tipo)
        SELECT DISTINCT ubicacion_destino, 'destino'
        FROM auditorias
        WHERE ubicacion_destino IS NOT NULL
    """)
    
    # Agregar columna temporal para el nuevo FK
    op.add_column('auditorias', sa.Column('ubicacion_destino_id', sa.Integer(), sa.ForeignKey('ubicaciones.id'), nullable=True))
    
    # Actualizar ubicacion_destino_id con los IDs correspondientes
    op.execute("""
        UPDATE auditorias
        SET ubicacion_destino_id = (
            SELECT id FROM ubicaciones
            WHERE ubicaciones.nombre = auditorias.ubicacion_destino
            AND ubicaciones.tipo = 'destino'
            LIMIT 1
        )
        WHERE ubicacion_destino IS NOT NULL
    """)
    
    # Eliminar columna antigua ubicacion_destino
    op.drop_column('auditorias', 'ubicacion_destino')


def downgrade() -> None:
    # Restaurar columna ubicacion_destino
    op.add_column('auditorias', sa.Column('ubicacion_destino', sa.String(), nullable=True))
    
    # Restaurar datos
    op.execute("""
        UPDATE auditorias
        SET ubicacion_destino = (
            SELECT nombre FROM ubicaciones
            WHERE ubicaciones.id = auditorias.ubicacion_destino_id
        )
        WHERE ubicacion_destino_id IS NOT NULL
    """)
    
    # Eliminar columnas nuevas
    op.drop_column('auditorias', 'ubicacion_destino_id')
    op.drop_column('auditorias', 'ubicacion_origen_id')
    
    # Eliminar tabla ubicaciones
    op.drop_table('ubicaciones')
