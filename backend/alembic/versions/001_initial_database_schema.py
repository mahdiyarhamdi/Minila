"""initial database schema with 18 tables

Revision ID: 001
Revises: 
Create Date: 2025-11-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create Country table
    op.create_table(
        'country',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create City table
    op.create_table(
        'city',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('country_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['country_id'], ['country.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_city_country_name', 'city', ['country_id', 'name'])

    # Create Avatar table
    op.create_table(
        'avatar',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_avatar_created_at', 'avatar', ['created_at'])

    # Create ProductClassification table
    op.create_table(
        'product_classification',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create Role table
    op.create_table(
        'role',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create Access table
    op.create_table(
        'access',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create User table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('password', sa.String(length=255), nullable=True),
        sa.Column('otp_code', sa.String(length=10), nullable=True),
        sa.Column('national_id', sa.String(length=20), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('avatar_id', sa.Integer(), nullable=True),
        sa.Column('country_id', sa.Integer(), nullable=True),
        sa.Column('city_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['avatar_id'], ['avatar.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['country_id'], ['country.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['city_id'], ['city.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_email', 'user', ['email'], unique=True)
    op.create_index('ix_user_created_at', 'user', ['created_at'])

    # Create RoleAccess table
    op.create_table(
        'role_access',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('access_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['access_id'], ['access.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role_id', 'access_id', name='uq_role_access')
    )
    op.create_index('ix_role_access_role_id', 'role_access', ['role_id'])
    op.create_index('ix_role_access_access_id', 'role_access', ['access_id'])

    # Create Community table
    op.create_table(
        'community',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_id', sa.Integer(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['avatar_id'], ['avatar.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_community_owner_id', 'community', ['owner_id'])

    # Create Membership table
    op.create_table(
        'membership',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('community_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['community_id'], ['community.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'community_id', name='uq_user_community')
    )
    op.create_index('ix_membership_community_active', 'membership', ['community_id', 'is_active'])

    # Create Request table
    op.create_table(
        'request',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('community_id', sa.Integer(), nullable=False),
        sa.Column('is_approved', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['community_id'], ['community.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'community_id', name='uq_request_user_community')
    )
    op.create_index('ix_request_community_status', 'request', ['community_id', 'is_approved', 'created_at'])

    # Create Card table
    op.create_table(
        'card',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('is_sender', sa.Boolean(), nullable=False),
        sa.Column('origin_country_id', sa.Integer(), nullable=False),
        sa.Column('origin_city_id', sa.Integer(), nullable=False),
        sa.Column('destination_country_id', sa.Integer(), nullable=False),
        sa.Column('destination_city_id', sa.Integer(), nullable=False),
        sa.Column('start_time_frame', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time_frame', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ticket_date_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('is_packed', sa.Boolean(), nullable=True),
        sa.Column('price_aed', sa.Float(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('product_classification_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('(end_time_frame IS NULL) OR (start_time_frame IS NULL) OR (end_time_frame >= start_time_frame)', name='check_timeframe_order'),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['origin_country_id'], ['country.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['origin_city_id'], ['city.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['destination_country_id'], ['country.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['destination_city_id'], ['city.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['product_classification_id'], ['product_classification.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_card_origin_city_id', 'card', ['origin_city_id'])
    op.create_index('ix_card_destination_city_id', 'card', ['destination_city_id'])
    op.create_index('ix_card_start_time_frame', 'card', ['start_time_frame'])
    op.create_index('ix_card_end_time_frame', 'card', ['end_time_frame'])
    op.create_index('ix_card_product_classification_id', 'card', ['product_classification_id'])
    op.create_index('ix_card_is_packed', 'card', ['is_packed'])

    # Create CardCommunity table
    op.create_table(
        'card_community',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('community_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['card.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['community_id'], ['community.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('card_id', 'community_id', name='uq_card_community')
    )
    op.create_index('ix_card_community_community_id', 'card_community', ['community_id'])

    # Create Message table
    op.create_table(
        'message',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('receiver_id', sa.Integer(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('sender_id != receiver_id', name='check_sender_not_receiver'),
        sa.ForeignKeyConstraint(['sender_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['receiver_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_message_receiver_created', 'message', ['receiver_id', 'created_at'])
    op.create_index('ix_message_sender_created', 'message', ['sender_id', 'created_at'])

    # Create UserBlock table
    op.create_table(
        'user_block',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('blocker_id', sa.Integer(), nullable=False),
        sa.Column('blocked_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['blocker_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocker_blocked')
    )
    op.create_index('ix_user_block_blocker_id', 'user_block', ['blocker_id'])

    # Create Report table
    op.create_table(
        'report',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=True),
        sa.Column('reported_id', sa.Integer(), nullable=True),
        sa.Column('card_id', sa.Integer(), nullable=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['reporter_id'], ['user.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reported_id'], ['user.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['card_id'], ['card.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_report_card_created', 'report', ['card_id', 'created_at'])
    op.create_index('ix_report_reporter_created', 'report', ['reporter_id', 'created_at'])

    # Create Log table
    op.create_table(
        'log',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('ip', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.Column('actor_user_id', sa.Integer(), nullable=True),
        sa.Column('target_user_id', sa.Integer(), nullable=True),
        sa.Column('card_id', sa.Integer(), nullable=True),
        sa.Column('community_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['user.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_user_id'], ['user.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['card_id'], ['card.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['community_id'], ['community.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_log_event_created', 'log', ['event_type', 'created_at'])
    op.create_index('ix_log_actor_created', 'log', ['actor_user_id', 'created_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('log')
    op.drop_table('report')
    op.drop_table('user_block')
    op.drop_table('message')
    op.drop_table('card_community')
    op.drop_table('card')
    op.drop_table('request')
    op.drop_table('membership')
    op.drop_table('community')
    op.drop_table('role_access')
    op.drop_table('user')
    op.drop_table('access')
    op.drop_table('role')
    op.drop_table('product_classification')
    op.drop_table('avatar')
    op.drop_table('city')
    op.drop_table('country')

