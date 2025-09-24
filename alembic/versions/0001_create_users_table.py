"""Create users table

Revision ID: e4f3f95cf880
Revises: 
Create Date: 2025-09-23 18:50:12.610527

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('usuarios',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(), nullable=False),
    sa.Column('correo', sa.String(), nullable=False),
    sa.Column('contrasena_hash', sa.String(), nullable=False),
    sa.Column('rol', sa.String(), nullable=False),
    sa.Column('creado_en', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('correo')
    )
    op.create_index(op.f('ix_usuarios_correo'), 'usuarios', ['correo'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_usuarios_correo'), table_name='usuarios')
    op.drop_table('usuarios')