"""add_modo_auditoria_field

Revision ID: a6097efa3864
Revises: 06d5cac4169b
Create Date: 2025-11-20 15:20:20.932049

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6097efa3864'
down_revision: Union[str, None] = '06d5cac4169b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('auditorias', sa.Column('modo_auditoria', sa.String(), nullable=True, server_default='normal'))


def downgrade() -> None:
    op.drop_column('auditorias', 'modo_auditoria')
