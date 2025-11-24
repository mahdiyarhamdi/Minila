"""add message status and read fields

Revision ID: 003
Revises: b43a2a02ff04
Create Date: 2025-11-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = 'b43a2a02ff04'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_read column to message table
    op.add_column(
        'message',
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Add read_at column to message table
    op.add_column(
        'message',
        sa.Column('read_at', sa.DateTime(), nullable=True)
    )
    
    # Add status column to message table
    op.add_column(
        'message',
        sa.Column('status', sa.String(20), nullable=False, server_default='sent')
    )
    
    # Create index on is_read for faster queries
    op.create_index('ix_message_is_read', 'message', ['is_read'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_message_is_read', table_name='message')
    
    # Remove columns
    op.drop_column('message', 'status')
    op.drop_column('message', 'read_at')
    op.drop_column('message', 'is_read')

