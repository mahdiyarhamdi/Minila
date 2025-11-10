"""add email verification fields

Revision ID: 002
Revises: 001
Create Date: 2025-11-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email_verified column to user table
    op.add_column(
        'user',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Add otp_expires_at column to user table
    op.add_column(
        'user',
        sa.Column('otp_expires_at', sa.DateTime(), nullable=True)
    )
    
    # Create index on email_verified for faster queries
    op.create_index('ix_user_email_verified', 'user', ['email_verified'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_user_email_verified', table_name='user')
    
    # Remove columns
    op.drop_column('user', 'otp_expires_at')
    op.drop_column('user', 'email_verified')

