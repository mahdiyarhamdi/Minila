"""User repository برای دسترسی به دیتابیس."""
from typing import Optional
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.user import User


async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """دریافت کاربر با ایمیل.
    
    Args:
        db: Database session
        email: آدرس ایمیل کاربر
        
    Returns:
        کاربر یا None
    """
    query = (
        select(User)
        .where(User.email == email)
        .options(
            selectinload(User.avatar),
            selectinload(User.country),
            selectinload(User.city)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """دریافت کاربر با ID.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        کاربر یا None
    """
    query = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.avatar),
            selectinload(User.country),
            selectinload(User.city)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    **kwargs
) -> User:
    """ساخت کاربر جدید.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        password: رمز عبور (خام - باید hash شود در production)
        first_name: نام
        last_name: نام خانوادگی
        **kwargs: فیلدهای اختیاری دیگر
        
    Returns:
        کاربر ایجادشده
    """
    user = User(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        **kwargs
    )
    
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    return user


async def update_user(
    db: AsyncSession,
    user_id: int,
    **updates
) -> Optional[User]:
    """آپدیت اطلاعات کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        کاربر آپدیت‌شده یا None
    """
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(**updates)
        .returning(User)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.scalar_one_or_none()


async def update_otp(
    db: AsyncSession,
    email: str,
    otp_code: Optional[str],
    otp_expires_at: Optional[datetime] = None
) -> bool:
    """آپدیت کد OTP کاربر.
    
    Args:
        db: Database session
        email: آدرس ایمیل کاربر
        otp_code: کد OTP جدید (یا None برای پاک کردن)
        otp_expires_at: زمان انقضای OTP
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(User)
        .where(User.email == email)
        .values(otp_code=otp_code, otp_expires_at=otp_expires_at)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.rowcount > 0


async def set_active_status(
    db: AsyncSession,
    user_id: int,
    is_active: bool
) -> bool:
    """تغییر وضعیت فعال/غیرفعال کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        is_active: وضعیت جدید
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(is_active=is_active)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.rowcount > 0


async def email_exists(db: AsyncSession, email: str) -> bool:
    """بررسی وجود ایمیل در سیستم.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        
    Returns:
        True اگر ایمیل قبلاً ثبت شده باشد
    """
    query = select(User.id).where(User.email == email)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def set_email_verified(
    db: AsyncSession,
    email: str,
    verified: bool = True
) -> bool:
    """تنظیم وضعیت تایید ایمیل.
    
    Args:
        db: Database session
        email: آدرس ایمیل کاربر
        verified: وضعیت تایید (پیش‌فرض True)
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(User)
        .where(User.email == email)
        .values(email_verified=verified)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.rowcount > 0


async def update_password(
    db: AsyncSession,
    user_id: int,
    hashed_password: str
) -> bool:
    """آپدیت رمز عبور کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        hashed_password: رمز عبور هش شده
        
    Returns:
        True در صورت موفقیت
    """
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(password=hashed_password)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.rowcount > 0

