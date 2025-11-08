"""Community service برای منطق مدیریت کامیونیتی‌ها."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.community import Community
from ..models.membership import Membership, Request
from ..repositories import community_repo, membership_repo
from ..services import log_service
from ..utils.pagination import PaginatedResponse
from ..utils.email import send_membership_request_notification, send_membership_result
from ..utils.logger import logger


async def get_communities(
    db: AsyncSession,
    page: int,
    page_size: int
):
    """دریافت لیست کامیونیتی‌ها.
    
    Args:
        db: Database session
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از کامیونیتی‌ها
    """
    communities, total = await community_repo.get_all(db, page, page_size)
    
    return PaginatedResponse.create(
        items=communities,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_community(
    db: AsyncSession,
    community_id: int
) -> Community:
    """دریافت جزئیات کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        
    Returns:
        Community
        
    Raises:
        ValueError: اگر کامیونیتی یافت نشود
    """
    community = await community_repo.get_by_id(db, community_id)
    
    if not community:
        raise ValueError("کامیونیتی یافت نشد")
    
    return community


async def create_community(
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
        bio: بیوگرافی
        avatar_id: شناسه آواتار
        
    Returns:
        Community ایجادشده
        
    Raises:
        ValueError: اگر نام تکراری باشد
    """
    # بررسی نام تکراری
    if await community_repo.name_exists(db, name):
        raise ValueError("این نام قبلاً استفاده شده است")
    
    # ساخت community
    community = await community_repo.create(
        db,
        owner_id=owner_id,
        name=name,
        bio=bio,
        avatar_id=avatar_id
    )
    
    # ساخت membership خودکار برای owner با role=owner
    await membership_repo.create_membership(
        db,
        user_id=owner_id,
        community_id=community.id,
        role_name="owner"
    )
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="community_create",
        actor_user_id=owner_id,
        community_id=community.id,
        payload={"name": name}
    )
    
    await db.commit()
    
    logger.info(f"Community created: {name} by user {owner_id}")
    return community


async def update_community(
    db: AsyncSession,
    community_id: int,
    user_id: int,
    **updates
) -> Community:
    """ویرایش کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        user_id: شناسه کاربر
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        Community آپدیت‌شده
        
    Raises:
        ValueError: اگر کامیونیتی یافت نشود
        PermissionError: اگر کاربر مجاز نباشد
    """
    # بررسی وجود community
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی یافت نشد")
    
    # بررسی permission (فقط owner/manager)
    if not await membership_repo.is_manager(db, user_id, community_id):
        raise PermissionError("شما مجاز به ویرایش این کامیونیتی نیستید")
    
    # حذف فیلدهای None
    updates_clean = {k: v for k, v in updates.items() if v is not None}
    
    if not updates_clean:
        return community
    
    # اعمال تغییرات
    updated_community = await community_repo.update_community(
        db,
        community_id,
        **updates_clean
    )
    
    await db.commit()
    
    logger.info(f"Community updated: {community_id} by user {user_id}")
    return updated_community or community


async def join_request(
    db: AsyncSession,
    user_id: int,
    community_id: int
):
    """درخواست عضویت در کامیونیتی.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        community_id: شناسه کامیونیتی
        
    Returns:
        Request ایجادشده
        
    Raises:
        ValueError: اگر قبلاً عضو باشد یا درخواست داشته باشد
    """
    # بررسی وجود کامیونیتی
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی مورد نظر یافت نشد")
    
    # بررسی عضویت فعلی
    membership = await membership_repo.get_membership(db, user_id, community_id)
    if membership and membership.is_active:
        raise ValueError("شما قبلاً عضو این کامیونیتی هستید")
    
    # بررسی درخواست تکراری
    if await membership_repo.has_pending_request(db, user_id, community_id):
        raise ValueError("شما قبلاً درخواست عضویت ارسال کرده‌اید")
    
    # ساخت درخواست
    request = await membership_repo.create_request(db, user_id, community_id)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="join_request",
        actor_user_id=user_id,
        community_id=community_id
    )
    
    await db.commit()
    
    # ارسال ایمیل به مدیران (async در پس‌زمینه)
    # TODO: پیدا کردن ایمیل مدیران و ارسال نوتیفیکیشن
    
    logger.info(f"Join request: user {user_id} → community {community_id}")
    return request


async def get_join_requests(
    db: AsyncSession,
    community_id: int,
    user_id: int
):
    """دریافت درخواست‌های عضویت.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        user_id: شناسه کاربر درخواست‌کننده
        
    Returns:
        لیست درخواست‌های pending
        
    Raises:
        PermissionError: اگر کاربر مجاز نباشد
    """
    # بررسی permission (فقط manager)
    if not await membership_repo.is_manager(db, user_id, community_id):
        raise PermissionError("شما مجاز به مشاهده درخواست‌ها نیستید")
    
    return await membership_repo.get_pending_requests(db, community_id)


async def handle_request(
    db: AsyncSession,
    request_id: int,
    user_id: int,
    approve: bool
):
    """تایید یا رد درخواست عضویت.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        user_id: شناسه کاربر (مدیر)
        approve: True برای تایید، False برای رد
        
    Returns:
        Membership اگر تایید شد، None اگر رد شد
        
    Raises:
        ValueError: اگر درخواست یافت نشود یا قبلاً پردازش شده باشد
        PermissionError: اگر کاربر مجاز نباشد
    """
    # دریافت درخواست
    request = await membership_repo.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("درخواست یافت نشد")
    
    if request.is_approved is not None:
        raise ValueError("این درخواست قبلاً پردازش شده است")
    
    # بررسی permission
    if not await membership_repo.is_manager(db, user_id, request.community_id):
        raise PermissionError("شما مجاز به پردازش این درخواست نیستید")
    
    membership = None
    
    if approve:
        # تایید درخواست
        await membership_repo.approve_request(db, request_id)
        
        # ساخت membership
        membership = await membership_repo.create_membership(
            db,
            user_id=request.user_id,
            community_id=request.community_id,
            role_name="member"
        )
        
        # ثبت لاگ
        await log_service.log_event(
            db,
            event_type="join_approve",
            actor_user_id=user_id,
            target_user_id=request.user_id,
            community_id=request.community_id
        )
    else:
        # رد درخواست
        await membership_repo.reject_request(db, request_id)
        
        # ثبت لاگ
        await log_service.log_event(
            db,
            event_type="join_reject",
            actor_user_id=user_id,
            target_user_id=request.user_id,
            community_id=request.community_id
        )
    
    await db.commit()
    
    # ارسال ایمیل نتیجه
    try:
        # TODO: دریافت ایمیل کاربر و نام کامیونیتی
        # send_membership_result(user_email, community_name, approve)
        pass
    except Exception as e:
        logger.warning(f"Failed to send membership result email: {e}")
    
    logger.info(f"Request {request_id} {'approved' if approve else 'rejected'} by user {user_id}")
    return membership


async def get_members(
    db: AsyncSession,
    community_id: int,
    page: int,
    page_size: int
):
    """دریافت اعضای کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از Membership
        
    Raises:
        ValueError: اگر کامیونیتی یافت نشود
    """
    # بررسی وجود کامیونیتی
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی مورد نظر یافت نشد")
    
    members, total = await community_repo.get_members(db, community_id, page, page_size)
    
    return PaginatedResponse.create(
        items=members,
        total=total,
        page=page,
        page_size=page_size
    )

