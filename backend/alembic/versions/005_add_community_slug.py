"""Add slug field to community table.

Revision ID: 005_add_community_slug
Revises: b43a2a02ff04
Create Date: 2025-12-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_community_slug'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # اضافه کردن ستون slug با مقدار پیش‌فرض موقت
    op.add_column('community', sa.Column('slug', sa.String(50), nullable=True))
    
    # آپدیت رکوردهای موجود با slug بر اساس id
    op.execute("""
        UPDATE community 
        SET slug = LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_'))
        WHERE slug IS NULL
    """)
    
    # اگر هنوز duplicate وجود دارد، با id ترکیب کن
    op.execute("""
        UPDATE community c1
        SET slug = slug || '_' || id::text
        WHERE EXISTS (
            SELECT 1 FROM community c2 
            WHERE c2.slug = c1.slug AND c2.id < c1.id
        )
    """)
    
    # تبدیل به NOT NULL
    op.alter_column('community', 'slug', nullable=False)
    
    # اضافه کردن unique constraint
    op.create_unique_constraint('uq_community_slug', 'community', ['slug'])
    
    # اضافه کردن index
    op.create_index('ix_community_slug', 'community', ['slug'])
    
    # حذف unique constraint از name (اختیاری - چون slug جایگزین می‌شود)
    # نگه می‌داریم چون name هم باید یکتا باشد


def downgrade() -> None:
    op.drop_index('ix_community_slug', table_name='community')
    op.drop_constraint('uq_community_slug', 'community', type_='unique')
    op.drop_column('community', 'slug')

