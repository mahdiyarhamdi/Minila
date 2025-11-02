"""Authentication service برای منطق احراز هویت."""
import secrets
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.config import get_settings
from ..core.security import create_access_token, create_refresh_token, decode_token
from ..models.user import User
from ..repositories import user_repo
from ..services import log_service
from ..utils.email import send_otp_email, send_welcome_email
from ..utils.logger import logger

settings = get_settings()


def generate_otp() -> str:
    """تولید کد OTP 6 رقمی.
    
    Returns:
        کد OTP
    """
    return str(secrets.randbelow(1000000)).zfill(6)


async def signup(
    db: AsyncSession,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """ثبت‌نام کاربر جدید.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        password: رمز عبور
        first_name: نام
        last_name: نام خانوادگی
        ip: آدرس IP کاربر
        user_agent: User-Agent
        
    Returns:
        کاربر ایجادشده
        
    Raises:
        ValueError: اگر ایمیل تکراری باشد
    """
    # بررسی duplicate email
    if await user_repo.email_exists(db, email):
        raise ValueError("این ایمیل قبلاً ثبت شده است")
    
    # ساخت کاربر
    # نکته: password فعلاً خام ذخیره می‌شود - باید در production hash شود
    user = await user_repo.create(
        db,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="signup",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email}
    )
    
    await db.commit()
    
    # ارسال ایمیل خوش‌آمدگویی
    try:
        send_welcome_email(email, first_name)
    except Exception as e:
        logger.warning(f"Failed to send welcome email: {e}")
    
    logger.info(f"User signed up: {email}")
    return user


async def request_otp(
    db: AsyncSession,
    email: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """درخواست OTP برای ورود.
    
    Args:
        db: Database session
        email: آدرس ایمیل کاربر
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        True در صورت موفقیت
        
    Raises:
        ValueError: اگر کاربر پیدا نشود یا غیرفعال باشد
    """
    # بررسی وجود کاربر
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("کاربری با این ایمیل یافت نشد")
    
    if not user.is_active:
        raise ValueError("حساب کاربری شما غیرفعال شده است")
    
    # تولید OTP
    otp_code = generate_otp()
    
    # ذخیره در دیتابیس
    # نکته: OTP فعلاً خام ذخیره می‌شود - باید در production hash شود
    await user_repo.update_otp(db, email, otp_code)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="login_attempt",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email}
    )
    
    await db.commit()
    
    # ارسال ایمیل
    send_otp_email(email, otp_code)
    
    logger.info(f"OTP requested for: {email}")
    return True


async def verify_otp(
    db: AsyncSession,
    email: str,
    otp_code: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """تایید OTP و ورود کاربر.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        otp_code: کد OTP دریافت شده
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        کاربر وارد شده
        
    Raises:
        ValueError: اگر OTP نامعتبر باشد
    """
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("کاربری با این ایمیل یافت نشد")
    
    if not user.is_active:
        raise ValueError("حساب کاربری شما غیرفعال شده است")
    
    # بررسی OTP
    if not user.otp_code or user.otp_code != otp_code:
        raise ValueError("کد OTP نامعتبر است")
    
    # پاک کردن OTP بعد از استفاده (single-use)
    await user_repo.update_otp(db, email, None)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="login_success",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email}
    )
    
    await db.commit()
    
    logger.info(f"User logged in: {email}")
    return user


def create_tokens(user_id: int, email: str) -> dict[str, str | int]:
    """تولید JWT tokens برای کاربر.
    
    Args:
        user_id: شناسه کاربر
        email: ایمیل کاربر
        
    Returns:
        dict حاوی access_token, refresh_token و expires_in
    """
    # تولید access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user_id, "email": email},
        expires_delta=access_token_expires
    )
    
    # تولید refresh token
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    refresh_token = create_refresh_token(
        data={"user_id": user_id, "email": email},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds())
    }


def refresh_access_token(refresh_token: str) -> dict[str, str | int]:
    """تازه‌سازی access token با refresh token.
    
    Args:
        refresh_token: توکن تازه‌سازی
        
    Returns:
        dict حاوی access_token جدید
        
    Raises:
        ValueError: اگر refresh token نامعتبر باشد
    """
    try:
        # Decode refresh token
        payload = decode_token(refresh_token, settings.SECRET_KEY)
        
        if not payload:
            raise ValueError("Refresh token نامعتبر است")
        
        user_id = payload.get("user_id")
        email = payload.get("email")
        
        if not user_id or not email:
            raise ValueError("Refresh token نامعتبر است")
        
        # تولید access token جدید
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user_id, "email": email},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds())
        }
        
    except Exception as e:
        logger.warning(f"Failed to refresh token: {e}")
        raise ValueError("Refresh token نامعتبر است")

