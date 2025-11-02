"""User service برای منطق مدیریت کاربران."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
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
        raise ValueError("کاربر یافت نشد")
    
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

