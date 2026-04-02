"""make novedad column nullable

Revision ID: make_novedad_nullable
Revises: f0dc5c4af621
Create Date: 2025-04-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'make_novedad_nullable'
down_revision: Union[str, None] = 'f0dc5c4af621'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('productos_auditados', 'novedad',
                     existing_type=sa.String(),
                     nullable=True)


def downgrade() -> None:
    op.execute("UPDATE productos_auditados SET novedad = 'sin_novedad' WHERE novedad IS NULL")
    op.alter_column('productos_auditados', 'novedad',
                     existing_type=sa.String(),
                     nullable=False)
