"""Add card analytics (card_view table) for tracking views and clicks.

Revision ID: 008_add_card_analytics
Revises: 007_add_dynamic_pricing
Create Date: 2025-12-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_add_card_analytics'
down_revision: Union[str, None] = '007_add_dynamic_pricing'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create card_view table for tracking impressions and clicks."""
    op.create_table(
        'card_view',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('view_type', sa.String(length=20), nullable=False, comment="View type: 'impression' or 'click'"),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['card.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('ix_card_view_card_id', 'card_view', ['card_id'], unique=False)
    op.create_index('ix_card_view_user_id', 'card_view', ['user_id'], unique=False)
    op.create_index('ix_card_view_view_type', 'card_view', ['view_type'], unique=False)
    op.create_index('ix_card_view_created_at', 'card_view', ['created_at'], unique=False)


def downgrade() -> None:
    """Remove card_view table."""
    op.drop_index('ix_card_view_created_at', table_name='card_view')
    op.drop_index('ix_card_view_view_type', table_name='card_view')
    op.drop_index('ix_card_view_user_id', table_name='card_view')
    op.drop_index('ix_card_view_card_id', table_name='card_view')
    op.drop_table('card_view')

