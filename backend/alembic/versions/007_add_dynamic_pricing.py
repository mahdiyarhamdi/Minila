"""Add dynamic pricing - route_price table and price_per_kg field.

Revision ID: 007_dynamic_pricing
Revises: 006_add_preferred_language
Create Date: 2025-12-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_dynamic_pricing'
down_revision: Union[str, None] = '006_add_preferred_language'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create route_price table
    op.create_table(
        'route_price',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('origin_city_id', sa.Integer(), nullable=False),
        sa.Column('destination_city_id', sa.Integer(), nullable=False),
        sa.Column('base_ticket_price_usd', sa.Float(), nullable=False, comment='Average ticket price in USD'),
        sa.Column('price_per_kg_suggested', sa.Float(), nullable=False, comment='Suggested price per kg'),
        sa.Column('last_updated', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='manual', comment='Data source'),
        sa.Column('confidence_score', sa.Float(), nullable=True, comment='Confidence score 0-1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['origin_city_id'], ['city.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['destination_city_id'], ['city.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('origin_city_id', 'destination_city_id', name='uq_route_price_cities')
    )
    
    # Create indexes for route_price
    op.create_index('ix_route_price_origin_dest', 'route_price', ['origin_city_id', 'destination_city_id'])
    op.create_index('ix_route_price_origin', 'route_price', ['origin_city_id'])
    op.create_index('ix_route_price_destination', 'route_price', ['destination_city_id'])
    
    # Add price_per_kg column to card table
    op.add_column('card', sa.Column('price_per_kg', sa.Float(), nullable=True, comment='Price per kilogram'))
    
    # Add is_legacy_price column to card table
    op.add_column('card', sa.Column('is_legacy_price', sa.Boolean(), nullable=True, server_default='false', comment='True if price is total, not per kg'))
    
    # Migrate existing data: Convert price_aed to price_per_kg
    # For cards with weight, calculate per kg price
    # For cards without weight, mark as legacy
    op.execute("""
        UPDATE card 
        SET price_per_kg = CASE 
            WHEN weight > 0 THEN price_aed / weight 
            ELSE price_aed 
        END,
        is_legacy_price = CASE 
            WHEN weight IS NULL OR weight = 0 THEN true 
            ELSE false 
        END
        WHERE price_aed IS NOT NULL
    """)
    
    # Create index for price_per_kg
    op.create_index('ix_card_price_per_kg', 'card', ['price_per_kg'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_card_price_per_kg', table_name='card')
    
    # Remove new columns from card
    op.drop_column('card', 'is_legacy_price')
    op.drop_column('card', 'price_per_kg')
    
    # Drop route_price indexes
    op.drop_index('ix_route_price_destination', table_name='route_price')
    op.drop_index('ix_route_price_origin', table_name='route_price')
    op.drop_index('ix_route_price_origin_dest', table_name='route_price')
    
    # Drop route_price table
    op.drop_table('route_price')

