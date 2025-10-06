
"""add more novelty types

Revision ID: c8a2d3e1f4b5
Revises: bad9064afb0b
Create Date: 2025-10-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8a2d3e1f4b5'
down_revision: Union[str, None] = 'bad9064afb0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE novedadenum ADD VALUE 'fecha_corta'")
    op.execute("ALTER TYPE novedadenum ADD VALUE 'contaminado'")
    op.execute("ALTER TYPE novedadenum ADD VALUE 'vencido'")


def downgrade() -> None:
    # Downgrading is not supported for this migration
    # as it would require recreating the enum type
    pass
