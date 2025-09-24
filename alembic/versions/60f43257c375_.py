"""empty message

Revision ID: 60f43257c375
Revises: 0003, bd8acd9b465c
Create Date: 2025-09-24 18:08:52.731044

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60f43257c375'
down_revision: Union[str, None] = ('0003', 'bd8acd9b465c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
