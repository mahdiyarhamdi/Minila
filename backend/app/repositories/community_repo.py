"""Community repository برای دسترسی به دیتابیس."""
from typing import Optional
from sqlalchemy import select, update, func, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.community import Community
from ..models.membership import Membership
from ..utils.pagination import calculate_offset


async def get_all(
    db: AsyncSession,
    page: int,
    page_size: int
) -> tuple[list[Community], int]:
    """دریافت لیست تمام کامیونیتی‌ها (paginated).
    
    Args:
        db: Database session
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست کامیونیتی‌ها، تعداد کل)
    """
    # Count total
    count_query = select(func.count(Community.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch communities
    offset = calculate_offset(page, page_size)
    query = (
        select(Community)
        .options(
            selectinload(Community.avatar),
            selectinload(Community.owner)
        )
        .order_by(Community.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    communities = list(result.scalars().all())
    
    # محاسبه member_count برای هر کامیونیتی
    for community in communities:
        community.member_count = await get_member_count(db, community.id)
    
    return communities, total


async def get_by_id(
    db: AsyncSession,
    community_id: int
) -> Optional[Community]:
    """دریافت کامیونیتی با ID.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        
    Returns:
        کامیونیتی یا None
    """
    query = (
        select(Community)
        .where(Community.id == community_id)
        .options(
            selectinload(Community.avatar),
            selectinload(Community.owner)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_by_name(
    db: AsyncSession,
    name: str
) -> Optional[Community]:
    """دریافت کامیونیتی با نام.
    
    Args:
        db: Database session
        name: نام کامیونیتی
        
    Returns:
        کامیونیتی یا None
    """
    query = select(Community).where(Community.name == name)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    owner_id: int,
    name: str,
    bio: Optional[str] = None,
    avatar_id: Optional[int] = None
) -> Community:
    """ساخت کامیونیتی جدید.
    
    Args:
        db: Database session
        owner_id: شناسه صاحب کامیونیتی
        name: نام کامیونیتی
        bio: بیوگرافی (اختیاری)
        avatar_id: شناسه آواتار (اختیاری)
        
    Returns:
        کامیونیتی ایجادشده با relationshipهای load شده
    """
    community = Community(
        owner_id=owner_id,
        name=name,
        bio=bio,
        avatar_id=avatar_id
    )
    
    db.add(community)
    await db.flush()
    await db.refresh(community)
    
    # بازگرفتن کامیونیتی با relationshipها
    query = (
        select(Community)
        .where(Community.id == community.id)
        .options(
            selectinload(Community.owner),
            selectinload(Community.avatar)
        )
    )
    result = await db.execute(query)
    return result.scalar_one()


async def update_community(
    db: AsyncSession,
    community_id: int,
    **updates
) -> Optional[Community]:
    """آپدیت اطلاعات کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        کامیونیتی آپدیت‌شده یا None
    """
    stmt = (
        update(Community)
        .where(Community.id == community_id)
        .values(**updates)
        .returning(Community)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.scalar_one_or_none()


async def check_common_membership(
    db: AsyncSession,
    user1_id: int,
    user2_id: int
) -> bool:
    """بررسی کامیونیتی مشترک بین دو کاربر.
    
    Args:
        db: Database session
        user1_id: شناسه کاربر اول
        user2_id: شناسه کاربر دوم
        
    Returns:
        True اگر حداقل یک کامیونیتی مشترک داشته باشند
    """
    # پیدا کردن کامیونیتی‌های مشترک
    subquery1 = (
        select(Membership.community_id)
        .where(Membership.user_id == user1_id)
        .where(Membership.is_active == True)
    )
    
    query = (
        select(Membership.id)
        .where(Membership.user_id == user2_id)
        .where(Membership.is_active == True)
        .where(Membership.community_id.in_(subquery1))
        .limit(1)
    )
    
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def get_members(
    db: AsyncSession,
    community_id: int,
    page: int,
    page_size: int
) -> tuple[list[Membership], int]:
    """دریافت اعضای کامیونیتی (paginated).
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست عضویت‌ها، تعداد کل)
    """
    # Count total
    count_query = (
        select(func.count(Membership.id))
        .where(Membership.community_id == community_id)
        .where(Membership.is_active == True)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch members
    offset = calculate_offset(page, page_size)
    query = (
        select(Membership)
        .where(Membership.community_id == community_id)
        .where(Membership.is_active == True)
        .options(
            selectinload(Membership.user),
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
        .order_by(Membership.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    members = list(result.scalars().all())
    
    return members, total


async def name_exists(db: AsyncSession, name: str) -> bool:
    """بررسی وجود نام کامیونیتی.
    
    Args:
        db: Database session
        name: نام کامیونیتی
        
    Returns:
        True اگر نام قبلاً ثبت شده باشد
    """
    query = select(Community.id).where(Community.name == name)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def get_member_count(db: AsyncSession, community_id: int) -> int:
    """دریافت تعداد اعضای فعال کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        
    Returns:
        تعداد اعضای فعال
    """
    query = (
        select(func.count(Membership.id))
        .where(Membership.community_id == community_id)
        .where(Membership.is_active == True)
    )
    result = await db.execute(query)
    return result.scalar() or 0

