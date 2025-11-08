"""Membership and Request repository."""
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.membership import Membership, Request
from ..models.role import Role


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
    community_id: int
) -> Optional[Membership]:
    """دریافت عضویت خاص.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        Membership یا None
    """
    query = (
        select(Membership)
        .where(Membership.user_id == user_id)
        .where(Membership.community_id == community_id)
        .options(selectinload(Membership.role))
    )
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
    community_id: int
) -> list[Request]:
    """دریافت درخواست‌های در انتظار.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        
    Returns:
        لیست درخواست‌های pending
    """
    query = (
        select(Request)
        .where(Request.community_id == community_id)
        .where(Request.is_approved.is_(None))
        .options(
            selectinload(Request.user),
            selectinload(Request.community)
        )
        .order_by(Request.created_at.asc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


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

