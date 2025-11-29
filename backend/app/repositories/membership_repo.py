"""Membership and Request repository."""
from typing import Optional
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.membership import Membership, Request
from ..models.role import Role
from ..utils.pagination import calculate_offset


async def get_user_memberships(
    db: AsyncSession,
    user_id: int
) -> list[Membership]:
    """دریافت عضویت‌های یک کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        لیست عضویت‌های فعال کاربر
    """
    query = (
        select(Membership)
        .where(Membership.user_id == user_id)
        .where(Membership.is_active == True)
        .options(
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_membership(
    db: AsyncSession,
    user_id: int,
    community_id: int,
    include_inactive: bool = False
) -> Optional[Membership]:
    """دریافت عضویت خاص.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        include_inactive: آیا عضویت‌های غیرفعال هم برگردد (پیش‌فرض: False)
        
    Returns:
        Membership یا None
    """
    query = (
        select(Membership)
        .where(Membership.user_id == user_id)
        .where(Membership.community_id == community_id)
        .options(selectinload(Membership.role))
    )
    
    # فیلتر عضویت‌های فعال (مگر اینکه صراحتاً غیرفعال‌ها هم بخواهیم)
    if not include_inactive:
        query = query.where(Membership.is_active == True)
    
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_membership(
    db: AsyncSession,
    user_id: int,
    community_id: int,
    role_name: str = "member"
) -> Membership:
    """ساخت عضویت جدید.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        role_name: نام نقش (پیش‌فرض: member)
        
    Returns:
        Membership ایجادشده
    """
    # پیدا کردن role_id
    role_query = select(Role.id).where(Role.name == role_name)
    role_result = await db.execute(role_query)
    role_id = role_result.scalar_one()
    
    membership = Membership(
        user_id=user_id,
        community_id=community_id,
        role_id=role_id,
        is_active=True
    )
    
    db.add(membership)
    await db.flush()
    await db.refresh(membership, attribute_names=["user", "community", "role"])
    
    return membership


async def create_request(
    db: AsyncSession,
    user_id: int,
    community_id: int
) -> Request:
    """ساخت درخواست عضویت.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        Request ایجادشده
    """
    request = Request(
        user_id=user_id,
        community_id=community_id,
        is_approved=None  # pending
    )
    
    db.add(request)
    await db.flush()
    await db.refresh(request, attribute_names=["user", "community"])
    
    return request


async def get_pending_requests(
    db: AsyncSession,
    community_id: int,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[Request], int]:
    """دریافت درخواست‌های در انتظار (paginated).
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست درخواست‌های pending، تعداد کل)
    """
    # Count total
    count_query = (
        select(func.count(Request.id))
        .where(Request.community_id == community_id)
        .where(Request.is_approved.is_(None))
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch requests
    offset = calculate_offset(page, page_size)
    query = (
        select(Request)
        .where(Request.community_id == community_id)
        .where(Request.is_approved.is_(None))
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
        .order_by(Request.created_at.asc())
        .limit(page_size)
        .offset(offset)
    )
    result = await db.execute(query)
    requests = list(result.scalars().all())
    
    return requests, total


async def get_request_by_id(
    db: AsyncSession,
    request_id: int
) -> Optional[Request]:
    """دریافت درخواست با ID.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        
    Returns:
        Request یا None
    """
    query = (
        select(Request)
        .where(Request.id == request_id)
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def has_pending_request(
    db: AsyncSession,
    user_id: int,
    community_id: int
) -> bool:
    """بررسی وجود درخواست pending.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        True اگر درخواست pending داشته باشد
    """
    query = (
        select(Request.id)
        .where(Request.user_id == user_id)
        .where(Request.community_id == community_id)
        .where(Request.is_approved.is_(None))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def get_existing_request(
    db: AsyncSession,
    user_id: int,
    community_id: int
) -> Optional[Request]:
    """دریافت درخواست موجود (هر وضعیتی).
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        Request یا None
    """
    query = (
        select(Request)
        .where(Request.user_id == user_id)
        .where(Request.community_id == community_id)
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def reset_request_to_pending(
    db: AsyncSession,
    request_id: int
) -> Optional[Request]:
    """بازنشانی درخواست به وضعیت pending.
    
    برای مواردی که کاربر قبلاً عضو بوده و حذف شده و می‌خواهد دوباره درخواست دهد.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        
    Returns:
        Request آپدیت‌شده
    """
    stmt = (
        update(Request)
        .where(Request.id == request_id)
        .values(is_approved=None)
    )
    await db.execute(stmt)
    await db.flush()
    
    # بارگذاری مجدد با relationshipها
    query = (
        select(Request)
        .where(Request.id == request_id)
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def delete_request(
    db: AsyncSession,
    request_id: int
) -> bool:
    """حذف درخواست عضویت.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        
    Returns:
        True در صورت موفقیت
    """
    from sqlalchemy import delete as sql_delete
    
    stmt = sql_delete(Request).where(Request.id == request_id)
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount > 0


async def approve_request(
    db: AsyncSession,
    request_id: int
) -> bool:
    """تایید درخواست عضویت.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(Request)
        .where(Request.id == request_id)
        .values(is_approved=True)
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount > 0


async def reject_request(
    db: AsyncSession,
    request_id: int
) -> bool:
    """رد درخواست عضویت.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(Request)
        .where(Request.id == request_id)
        .values(is_approved=False)
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount > 0


async def is_manager(
    db: AsyncSession,
    user_id: int,
    community_id: int
) -> bool:
    """بررسی مدیر بودن کاربر در کامیونیتی.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        True اگر کاربر manager یا owner باشد
    """
    query = (
        select(Membership.id)
        .join(Role)
        .where(Membership.user_id == user_id)
        .where(Membership.community_id == community_id)
        .where(Membership.is_active == True)
        .where(Role.name.in_(["manager", "owner"]))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def get_user_requests(
    db: AsyncSession,
    user_id: int
) -> list[Request]:
    """دریافت تمام درخواست‌های عضویت یک کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        لیست درخواست‌های کاربر (pending, approved, rejected)
    """
    query = (
        select(Request)
        .where(Request.user_id == user_id)
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
        .order_by(Request.created_at.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_membership_role(
    db: AsyncSession,
    membership_id: int,
    new_role_id: int
) -> Optional[Membership]:
    """تغییر نقش یک عضو در کامیونیتی.
    
    Args:
        db: Database session
        membership_id: شناسه عضویت
        new_role_id: شناسه نقش جدید
        
    Returns:
        Membership آپدیت‌شده یا None
    """
    stmt = (
        update(Membership)
        .where(Membership.id == membership_id)
        .values(role_id=new_role_id)
    )
    await db.execute(stmt)
    await db.flush()
    
    # بارگذاری مجدد با relationshipها
    query = (
        select(Membership)
        .where(Membership.id == membership_id)
        .options(
            selectinload(Membership.user),
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_membership_by_id(
    db: AsyncSession,
    membership_id: int
) -> Optional[Membership]:
    """دریافت عضویت با ID.
    
    Args:
        db: Database session
        membership_id: شناسه عضویت
        
    Returns:
        Membership یا None
    """
    query = (
        select(Membership)
        .where(Membership.id == membership_id)
        .options(
            selectinload(Membership.user),
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_role_by_name(db: AsyncSession, role_name: str) -> Optional[Role]:
    """دریافت نقش با نام.
    
    Args:
        db: Database session
        role_name: نام نقش
        
    Returns:
        Role یا None
    """
    query = select(Role).where(Role.name == role_name)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def reactivate_membership(
    db: AsyncSession,
    membership_id: int,
    role_name: str = "member"
) -> Optional[Membership]:
    """فعال‌سازی مجدد عضویت غیرفعال.
    
    برای مواردی که کاربر قبلاً عضو بوده و حذف شده و می‌خواهد دوباره عضو شود.
    
    Args:
        db: Database session
        membership_id: شناسه عضویت
        role_name: نام نقش (پیش‌فرض: member)
        
    Returns:
        Membership فعال‌شده
    """
    # پیدا کردن role_id
    role_query = select(Role.id).where(Role.name == role_name)
    role_result = await db.execute(role_query)
    role_id = role_result.scalar_one()
    
    stmt = (
        update(Membership)
        .where(Membership.id == membership_id)
        .values(is_active=True, role_id=role_id)
    )
    await db.execute(stmt)
    await db.flush()
    
    # بارگذاری مجدد با relationshipها
    query = (
        select(Membership)
        .where(Membership.id == membership_id)
        .options(
            selectinload(Membership.user),
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

