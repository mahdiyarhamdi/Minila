"""seed roles and accesses

Revision ID: b43a2a02ff04
Revises: 5740e92ed70c
Create Date: 2025-11-16 18:41:04.217215

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b43a2a02ff04'
down_revision = '5740e92ed70c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """اضافه کردن داده‌های اولیه برای roles و accesses."""
    
    # Insert roles با استفاده از execute مستقیم
    # توجه: ترتیب ID ها مطابق با seed_roles fixture در conftest.py
    op.execute("""
        INSERT INTO role (id, name, created_at, updated_at) VALUES
        (1, 'member', NOW(), NOW()),
        (2, 'manager', NOW(), NOW()),
        (3, 'owner', NOW(), NOW())
    """)
    
    # Insert accesses
    op.execute("""
        INSERT INTO access (id, name, created_at, updated_at) VALUES
        (1, 'read', NOW(), NOW()),
        (2, 'write', NOW(), NOW()),
        (3, 'delete', NOW(), NOW()),
        (4, 'manage', NOW(), NOW()),
        (5, 'invite', NOW(), NOW())
    """)
    
    # Member (id=1): read, write
    # Manager (id=2): read, write, delete, invite
    # Owner (id=3): همه دسترسی‌ها
    op.execute("""
        INSERT INTO role_access (role_id, access_id, created_at, updated_at) VALUES
        -- Member - read, write
        (1, 1, NOW(), NOW()),
        (1, 2, NOW(), NOW()),
        -- Manager - read, write, delete, invite
        (2, 1, NOW(), NOW()),
        (2, 2, NOW(), NOW()),
        (2, 3, NOW(), NOW()),
        (2, 5, NOW(), NOW()),
        -- Owner - all accesses
        (3, 1, NOW(), NOW()),
        (3, 2, NOW(), NOW()),
        (3, 3, NOW(), NOW()),
        (3, 4, NOW(), NOW()),
        (3, 5, NOW(), NOW())
    """)


def downgrade() -> None:
    """حذف داده‌های اولیه."""
    # حذف role_access records
    op.execute("DELETE FROM role_access WHERE role_id IN (1, 2, 3)")
    
    # حذف roles
    op.execute("DELETE FROM role WHERE id IN (1, 2, 3)")
    
    # حذف accesses
    op.execute("DELETE FROM access WHERE id IN (1, 2, 3, 4, 5)")

