"""add alert table

Revision ID: 009_add_alert_table
Revises: 008_add_card_analytics
Create Date: 2025-12-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '009_add_alert_table'
down_revision: Union[str, None] = '008_add_card_analytics'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create alert table
    op.create_table(
        'alert',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('priority', sa.String(20), nullable=False, server_default='normal'),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('email_sent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_alert_type_created', 'alert', ['type', 'created_at'])
    op.create_index('ix_alert_priority_read', 'alert', ['priority', 'is_read'])
    op.create_index('ix_alert_created_at', 'alert', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_alert_created_at', table_name='alert')
    op.drop_index('ix_alert_priority_read', table_name='alert')
    op.drop_index('ix_alert_type_created', table_name='alert')
    
    # Drop table
    op.drop_table('alert')

