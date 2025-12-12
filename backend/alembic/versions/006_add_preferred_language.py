"""Add preferred_language to user.

Revision ID: 006
Revises: 005_add_community_slug
Create Date: 2024-12-12
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '006_add_preferred_language'
down_revision = '005_add_community_slug'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add preferred_language column to user table."""
    op.add_column(
        'user',
        sa.Column(
            'preferred_language',
            sa.String(5),
            nullable=False,
            server_default='fa'
        )
    )
    
    # Remove server_default after setting values
    op.alter_column(
        'user',
        'preferred_language',
        server_default=None
    )


def downgrade() -> None:
    """Remove preferred_language column."""
    op.drop_column('user', 'preferred_language')

