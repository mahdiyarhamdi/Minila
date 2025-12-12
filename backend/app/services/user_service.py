"""User service برای منطق مدیریت کاربران."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.security import hash_password, verify_password
from ..models.user import User
from ..repositories import user_repo
from ..services import log_service
from ..utils.logger import logger


async def get_profile(
    db: AsyncSession,
    user_id: int
) -> Optional[User]:
    """دریافت پروفایل کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        User یا None
    """
    user = await user_repo.get_by_id(db, user_id)
    
    if not user:
        raise ValueError("کاربر یافت نشد")
    
    return user


async def update_profile(
    db: AsyncSession,
    user_id: int,
    **updates
) -> User:
    """ویرایش پروفایل کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        User آپدیت‌شده
        
    Raises:
        ValueError: اگر کاربر یافت نشود
    """
    # بررسی وجود کاربر
    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    # حذف فیلدهای None (که کاربر ارسال نکرده)
    updates_clean = {k: v for k, v in updates.items() if v is not None}
    
    if not updates_clean:
        # اگر هیچ تغییری نبود، همان user را برگردان
        return user
    
    # اعمال تغییرات
    updated_user = await user_repo.update_user(db, user_id, **updates_clean)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="profile_update",
        actor_user_id=user_id,
        payload={"updated_fields": list(updates_clean.keys())}
    )
    
    await db.commit()
    
    logger.info(f"User profile updated: {user_id}")
    return updated_user or user


async def change_password(
    db: AsyncSession,
    user_id: int,
    old_password: str,
    new_password: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """تغییر رمز عبور کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        old_password: رمز عبور فعلی
        new_password: رمز عبور جدید
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        True در صورت موفقیت
        
    Raises:
        ValueError: اگر رمز عبور فعلی نادرست باشد
    """
    # دریافت کاربر
    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    # بررسی password فعلی
    if not user.password:
        raise ValueError("Password not set")
    
    if not verify_password(old_password, user.password):
        raise ValueError("Current password is incorrect")
    
    # هش کردن password جدید
    hashed_new_password = hash_password(new_password)
    
    # آپدیت password
    await user_repo.update_password(db, user_id, hashed_new_password)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="password_changed",
        actor_user_id=user_id,
        ip=ip,
        user_agent=user_agent,
        payload={"user_id": user_id}
    )
    
    await db.commit()
    
    logger.info(f"Password changed for user: {user_id}")
    return True

