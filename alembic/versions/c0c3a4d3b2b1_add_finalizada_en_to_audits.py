"""add finalizada_en to audits

Revision ID: c0c3a4d3b2b1
Revises: bad9064afb0b
Create Date: 2025-10-30 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0c3a4d3b2b1'
down_revision: Union[str, None] = 'bad9064afb0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('auditorias', sa.Column('finalizada_en', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('auditorias', 'finalizada_en')
