"""add collaboration fields

Revision ID: add_collaboration_001
Revises: c0c3a4d3b2b1
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_collaboration_001'
down_revision = 'c0c3a4d3b2b1'
branch_labels = None
depends_on = None


def upgrade():
    # Agregar campos de colaboración a productos_auditados
    op.add_column('productos_auditados', sa.Column('locked_by_user_id', sa.Integer(), nullable=True))
    op.add_column('productos_auditados', sa.Column('locked_at', sa.DateTime(), nullable=True))
    op.add_column('productos_auditados', sa.Column('last_modified_by_id', sa.Integer(), nullable=True))
    op.add_column('productos_auditados', sa.Column('last_modified_at', sa.DateTime(), nullable=True))
    
    op.create_foreign_key('fk_locked_by_user', 'productos_auditados', 'usuarios', ['locked_by_user_id'], ['id'])
    op.create_foreign_key('fk_last_modified_by', 'productos_auditados', 'usuarios', ['last_modified_by_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_last_modified_by', 'productos_auditados', type_='foreignkey')
    op.drop_constraint('fk_locked_by_user', 'productos_auditados', type_='foreignkey')
    op.drop_column('productos_auditados', 'last_modified_at')
    op.drop_column('productos_auditados', 'last_modified_by_id')
    op.drop_column('productos_auditados', 'locked_at')
    op.drop_column('productos_auditados', 'locked_by_user_id')
