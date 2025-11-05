"""add product history

Revision ID: add_product_history
Revises: add_collaboration_fields
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_product_history'
down_revision = 'add_collaboration_001'
branch_label = None
depends_on = None

def upgrade():
    op.create_table('product_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('field_changed', sa.String(), nullable=False),
        sa.Column('old_value', sa.String(), nullable=True),
        sa.Column('new_value', sa.String(), nullable=True),
        sa.Column('modified_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['productos_auditados.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('product_history')
