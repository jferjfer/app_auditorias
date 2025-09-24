"""seed initial users

Revision ID: 6e027eb8dbe6
Revises: 60f43257c375
Create Date: 2025-09-25 00:49:21.193519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import bcrypt


# revision identifiers, used by Alembic.
revision: str = '6e027eb8dbe6'
down_revision: Union[str, None] = '60f43257c375'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Define the table structure for the User model
users_table = sa.table(
    'usuarios',
    sa.column('nombre', sa.String),
    sa.column('correo', sa.String),
    sa.column('contrasena_hash', sa.String),
    sa.column('rol', sa.String)
)


def upgrade() -> None:
    # Hash the password
    password = b"12345"
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

    # Prepare the user data
    seed_users = [
        {'nombre': 'felipe', 'correo': 'felipe@laika.com.co', 'contrasena_hash': hashed_password, 'rol': 'analista'},
        {'nombre': 'javier', 'correo': 'javier@laika.com.co', 'contrasena_hash': hashed_password, 'rol': 'administrador'},
        {'nombre': 'carlos', 'correo': 'carlos@laika.com.co', 'contrasena_hash': hashed_password, 'rol': 'auditor'},
    ]

    # Insert the users
    op.bulk_insert(users_table, seed_users)


def downgrade() -> None:
    # Delete the specific users based on their email
    op.execute("DELETE FROM usuarios WHERE correo IN ('felipe@laika.com.co', 'javier@laika.com.co', 'carlos@laika.com.co')")