"""Community service برای منطق مدیریت کامیونیتی‌ها."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.community import Community
from ..models.membership import Membership, Request
from ..repositories import community_repo, membership_repo
from ..services import log_service
from ..utils.pagination import PaginatedResponse
from ..utils.email import send_membership_request_notification, send_membership_result, send_role_change_notification
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
    community_id: int,
    user_id: Optional[int] = None
) -> Community:
    """دریافت جزئیات کامیونیتی.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        user_id: شناسه کاربر فعلی (اختیاری)
        
    Returns:
        Community با فیلدهای member_count، is_member، my_role
        
    Raises:
        ValueError: اگر کامیونیتی یافت نشود
    """
    community = await community_repo.get_by_id(db, community_id)
    
    if not community:
        raise ValueError("کامیونیتی یافت نشد")
    
    # محاسبه member_count
    community.member_count = await community_repo.get_member_count(db, community_id)
    
    # اگر کاربری لاگین کرده است
    if user_id:
        logger.debug(f"Checking community access: user_id={user_id}, community_id={community_id}, owner_id={community.owner_id}")
        
        # بررسی ownership
        if community.owner_id == user_id:
            community.is_member = True
            community.my_role = "owner"
            logger.debug(f"User {user_id} is owner of community {community_id}")
        else:
            # بررسی عضویت (فقط عضویت‌های فعال)
            membership = await membership_repo.get_membership(db, user_id, community_id)
            logger.debug(f"Membership check for user {user_id} in community {community_id}: found={membership is not None}")
            
            if membership:
                community.is_member = True
                # دریافت نام role از relation
                if membership.role:
                    community.my_role = membership.role.name
                    logger.debug(f"User {user_id} has role '{membership.role.name}' in community {community_id}")
                else:
                    # fallback: check with is_manager
                    is_mgr = await membership_repo.is_manager(db, user_id, community_id)
                    community.my_role = "manager" if is_mgr else "member"
                    logger.warning(f"Role relation not loaded for user {user_id} in community {community_id}, fallback: is_manager={is_mgr}")
            else:
                community.is_member = False
                community.my_role = None
                logger.debug(f"User {user_id} has no active membership in community {community_id}")
    else:
        community.is_member = None
        community.my_role = None
        logger.debug(f"No user_id provided for community {community_id} access check")
    
    return community


async def create_community(
    db: AsyncSession,
    owner_id: int,
    name: str,
    slug: str,
    bio: Optional[str] = None,
    avatar_id: Optional[int] = None
) -> Community:
    """ساخت کامیونیتی جدید.
    
    Args:
        db: Database session
        owner_id: شناسه صاحب کامیونیتی
        name: نام کامیونیتی
        slug: آیدی یکتای کامیونیتی
        bio: بیوگرافی
        avatar_id: شناسه آواتار
        
    Returns:
        Community ایجادشده
        
    Raises:
        ValueError: اگر نام یا slug تکراری باشد
    """
    # بررسی نام تکراری
    if await community_repo.name_exists(db, name):
        raise ValueError("این نام قبلاً استفاده شده است")
    
    # بررسی slug تکراری
    if await community_repo.slug_exists(db, slug):
        raise ValueError("این آیدی قبلاً استفاده شده است")
    
    # ساخت community
    community = await community_repo.create(
        db,
        owner_id=owner_id,
        name=name,
        slug=slug,
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
        Request ایجادشده یا بازنشانی‌شده
        
    Raises:
        ValueError: اگر قبلاً عضو فعال باشد یا درخواست pending داشته باشد
    """
    # بررسی وجود کامیونیتی
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی مورد نظر یافت نشد")
    
    # بررسی عضویت فعال
    membership = await membership_repo.get_membership(db, user_id, community_id)
    if membership:
        raise ValueError("شما قبلاً عضو این کامیونیتی هستید")
    
    # بررسی درخواست تکراری pending
    if await membership_repo.has_pending_request(db, user_id, community_id):
        raise ValueError("شما قبلاً درخواست عضویت ارسال کرده‌اید")
    
    # بررسی وجود درخواست قبلی (تایید/رد شده)
    existing_request = await membership_repo.get_existing_request(db, user_id, community_id)
    
    if existing_request:
        # درخواست قبلی وجود دارد - آن را به pending بازنشانی می‌کنیم
        # این برای کاربرانی است که قبلاً عضو بودند و حذف شدند
        request = await membership_repo.reset_request_to_pending(db, existing_request.id)
        logger.info(f"Join request reset: user {user_id} → community {community_id} (re-request)")
    else:
        # درخواست جدید می‌سازیم
        request = await membership_repo.create_request(db, user_id, community_id)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="join_request",
        actor_user_id=user_id,
        community_id=community_id
    )
    
    await db.commit()
    
    # ارسال ایمیل به مدیران
    try:
        # دریافت اطلاعات کاربر درخواست‌دهنده
        from ..repositories import user_repo
        user = await user_repo.get_by_id(db, user_id)
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
        
        # دریافت ایمیل مدیران
        managers = await community_repo.get_managers_emails(db, community_id)
        
        for manager in managers:
            try:
                send_membership_request_notification(
                    email=manager["email"],
                    user_name=user_name,
                    community_name=community.name,
                    language=manager.get("language", "en")
                )
            except Exception as e:
                logger.warning(f"Failed to send membership request email to {manager['email']}: {e}")
    except Exception as e:
        logger.warning(f"Failed to send membership request notifications: {e}")
    
    logger.info(f"Join request: user {user_id} → community {community_id}")
    return request


async def get_join_requests(
    db: AsyncSession,
    community_id: int,
    user_id: int,
    page: int = 1,
    page_size: int = 20
):
    """دریافت درخواست‌های عضویت (paginated).
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        user_id: شناسه کاربر درخواست‌کننده
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از درخواست‌های pending
        
    Raises:
        PermissionError: اگر کاربر مجاز نباشد
    """
    # بررسی permission (فقط manager)
    if not await membership_repo.is_manager(db, user_id, community_id):
        raise PermissionError("شما مجاز به مشاهده درخواست‌ها نیستید")
    
    requests, total = await membership_repo.get_pending_requests(db, community_id, page, page_size)
    
    return PaginatedResponse.create(
        items=requests,
        total=total,
        page=page,
        page_size=page_size
    )


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
        
        # بررسی آیا کاربر قبلاً عضو بوده (membership غیرفعال دارد)
        existing_membership = await membership_repo.get_membership(
            db, 
            request.user_id, 
            request.community_id,
            include_inactive=True
        )
        
        if existing_membership and not existing_membership.is_active:
            # فعال‌سازی مجدد عضویت قدیمی
            membership = await membership_repo.reactivate_membership(
                db,
                membership_id=existing_membership.id,
                role_name="member"
            )
            logger.info(f"Reactivated membership {existing_membership.id} for user {request.user_id}")
        else:
            # ساخت membership جدید
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
    
    # ارسال ایمیل نتیجه به کاربر
    try:
        from ..repositories import user_repo
        user = await user_repo.get_by_id(db, request.user_id)
        community = await community_repo.get_by_id(db, request.community_id)
        
        if user and community:
            send_membership_result(
                email=user.email,
                community_name=community.name,
                approved=approve,
                first_name=user.first_name or "",
                language=getattr(user, "preferred_language", "en")
            )
    except Exception as e:
        logger.warning(f"Failed to send membership result email: {e}")
    
    logger.info(f"Request {request_id} {'approved' if approve else 'rejected'} by user {user_id}")
    return membership


async def cancel_join_request(
    db: AsyncSession,
    request_id: int,
    user_id: int
):
    """لغو درخواست عضویت توسط کاربر.
    
    فقط درخواست‌های pending قابل لغو هستند.
    
    Args:
        db: Database session
        request_id: شناسه درخواست
        user_id: شناسه کاربر
        
    Raises:
        ValueError: اگر درخواست یافت نشود یا pending نباشد
        PermissionError: اگر کاربر مالک درخواست نباشد
    """
    # دریافت درخواست
    request = await membership_repo.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("درخواست یافت نشد")
    
    # بررسی مالکیت
    if request.user_id != user_id:
        raise PermissionError("شما مجاز به لغو این درخواست نیستید")
    
    # فقط درخواست‌های pending قابل لغو هستند
    if request.is_approved is not None:
        raise ValueError("فقط درخواست‌های در انتظار قابل لغو هستند")
    
    # حذف درخواست
    await membership_repo.delete_request(db, request_id)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="join_request_cancel",
        actor_user_id=user_id,
        community_id=request.community_id
    )
    
    await db.commit()
    
    logger.info(f"Join request cancelled: request {request_id} by user {user_id}")


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


async def change_member_role(
    db: AsyncSession,
    community_id: int,
    target_user_id: int,
    new_role: str,
    actor_user_id: int
):
    """تغییر نقش یک عضو در کامیونیتی.
    
    فقط owner می‌تواند نقش اعضا را تغییر دهد.
    نقش owner قابل تغییر نیست.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        target_user_id: شناسه کاربر هدف
        new_role: نقش جدید (member یا manager)
        actor_user_id: شناسه کاربر انجام‌دهنده
        
    Returns:
        Membership آپدیت‌شده
        
    Raises:
        ValueError: اگر عضویت یافت نشود یا نقش نامعتبر باشد
        PermissionError: اگر کاربر مجاز نباشد
    """
    # بررسی وجود کامیونیتی
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی یافت نشد")
    
    # فقط owner می‌تواند نقش‌ها را تغییر دهد
    if community.owner_id != actor_user_id:
        raise PermissionError("فقط مالک کامیونیتی می‌تواند نقش اعضا را تغییر دهد")
    
    # نمی‌توان نقش owner را تغییر داد
    if target_user_id == community.owner_id:
        raise ValueError("نمی‌توان نقش مالک کامیونیتی را تغییر داد")
    
    # بررسی نقش معتبر (فقط member یا manager)
    if new_role not in ["member", "manager"]:
        raise ValueError("نقش نامعتبر است. فقط member یا manager مجاز است")
    
    # دریافت عضویت هدف
    membership = await membership_repo.get_membership(db, target_user_id, community_id)
    if not membership:
        raise ValueError("این کاربر عضو کامیونیتی نیست")
    
    # دریافت role جدید
    role = await membership_repo.get_role_by_name(db, new_role)
    if not role:
        raise ValueError(f"نقش {new_role} در سیستم یافت نشد")
    
    membership_id = membership.id
    
    # آپدیت نقش
    await membership_repo.update_membership_role(
        db,
        membership_id,
        role.id
    )
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="role_change",
        actor_user_id=actor_user_id,
        target_user_id=target_user_id,
        community_id=community_id,
        payload={"new_role": new_role}
    )
    
    await db.commit()
    
    # بارگذاری مجدد عضویت با داده‌های جدید (با استفاده از تابع get_membership)
    # از refresh استفاده نمی‌کنیم چون async session ممکن است cache داشته باشد
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from ..models.membership import Membership
    
    query = (
        select(Membership)
        .where(Membership.id == membership_id)
        .options(
            selectinload(Membership.user),
            selectinload(Membership.community),
            selectinload(Membership.role)
        )
        .execution_options(populate_existing=True)  # Force refresh from DB
    )
    result = await db.execute(query)
    updated_membership = result.scalar_one_or_none()
    
    # ارسال ایمیل به کاربر
    try:
        from ..repositories import user_repo
        user = await user_repo.get_by_id(db, target_user_id)
        
        if user:
            send_role_change_notification(
                email=user.email,
                community_name=community.name,
                new_role=new_role,
                first_name=user.first_name or "",
                language=getattr(user, "preferred_language", "en")
            )
    except Exception as e:
        logger.warning(f"Failed to send role change email: {e}")
    
    logger.info(f"Role changed: user {target_user_id} in community {community_id} → {new_role} by {actor_user_id}")
    return updated_membership


async def remove_member(
    db: AsyncSession,
    community_id: int,
    target_user_id: int,
    actor_user_id: int
):
    """حذف عضو از کامیونیتی.
    
    owner یا manager می‌توانند اعضا را حذف کنند.
    owner قابل حذف نیست.
    
    Args:
        db: Database session
        community_id: شناسه کامیونیتی
        target_user_id: شناسه کاربر هدف
        actor_user_id: شناسه کاربر انجام‌دهنده
        
    Raises:
        ValueError: اگر عضویت یافت نشود
        PermissionError: اگر کاربر مجاز نباشد
    """
    # بررسی وجود کامیونیتی
    community = await community_repo.get_by_id(db, community_id)
    if not community:
        raise ValueError("کامیونیتی یافت نشد")
    
    # بررسی دسترسی (owner یا manager)
    if not await membership_repo.is_manager(db, actor_user_id, community_id):
        raise PermissionError("شما مجاز به حذف اعضا نیستید")
    
    # نمی‌توان owner را حذف کرد
    if target_user_id == community.owner_id:
        raise ValueError("نمی‌توان مالک کامیونیتی را حذف کرد")
    
    # دریافت عضویت هدف
    membership = await membership_repo.get_membership(db, target_user_id, community_id)
    if not membership:
        raise ValueError("این کاربر عضو کامیونیتی نیست")
    
    # غیرفعال کردن عضویت (soft delete)
    from sqlalchemy import update as sql_update
    from ..models.membership import Membership
    
    stmt = (
        sql_update(Membership)
        .where(Membership.id == membership.id)
        .values(is_active=False)
    )
    await db.execute(stmt)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="member_remove",
        actor_user_id=actor_user_id,
        target_user_id=target_user_id,
        community_id=community_id
    )
    
    await db.commit()
    
    logger.info(f"Member removed: user {target_user_id} from community {community_id} by {actor_user_id}")

