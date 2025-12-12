"""Authentication service برای منطق احراز هویت."""
import secrets
from typing import Optional, Dict, Union
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.config import get_settings
from ..core.security import (
    create_access_token, 
    create_refresh_token, 
    decode_token,
    hash_password,
    verify_password
)
from ..models.user import User
from ..repositories import user_repo
from ..services import log_service
from ..utils.email import send_otp_email
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
    language: str = "en",
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
        language: زبان ترجیحی (fa, en, ar)
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
    
    # هش کردن password
    hashed_password = hash_password(password)
    
    # تولید OTP برای تایید ایمیل
    otp_code = generate_otp()
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # ساخت کاربر با email_verified=False
    user = await user_repo.create(
        db,
        email=email,
        password=hashed_password,
        first_name=first_name,
        last_name=last_name,
        email_verified=False,
        otp_code=otp_code,
        otp_expires_at=otp_expires_at,
        preferred_language=language
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
    
    # ارسال OTP برای تایید ایمیل با زبان انتخابی
    try:
        send_otp_email(email, otp_code, language=language)
    except Exception as e:
        logger.warning(f"Failed to send verification OTP: {e}")
    
    logger.info(f"User signed up: {email}, verification OTP sent")
    return user


async def verify_email_otp(
    db: AsyncSession,
    email: str,
    otp_code: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """تایید ایمیل با OTP.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        otp_code: کد OTP دریافت شده
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        کاربر با ایمیل تایید شده
        
    Raises:
        ValueError: اگر OTP نامعتبر یا منقضی شده باشد
    """
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("کاربری با این ایمیل یافت نشد")
    
    # بررسی اینکه ایمیل قبلاً تایید نشده باشد
    if user.email_verified:
        raise ValueError("ایمیل قبلاً تایید شده است")
    
    # بررسی OTP
    if not user.otp_code or user.otp_code != otp_code:
        raise ValueError("کد OTP نامعتبر است")
    
    # بررسی انقضای OTP
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise ValueError("کد OTP منقضی شده است")
    
    # تنظیم email_verified و پاک کردن OTP
    await user_repo.set_email_verified(db, email, True)
    await user_repo.update_otp(db, email, None, None)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="email_verified",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email}
    )
    
    await db.commit()
    
    # بارگذاری مجدد کاربر
    user = await user_repo.get_by_email(db, email)
    
    logger.info(f"Email verified for: {email}")
    return user


async def request_otp(
    db: AsyncSession,
    email: str,
    language: Optional[str] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """درخواست OTP برای ورود.
    
    Args:
        db: Database session
        email: آدرس ایمیل کاربر
        language: زبان ایمیل (اختیاری - اگر نباشد از preferred_language کاربر)
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        True در صورت موفقیت
        
    Raises:
        ValueError: اگر کاربر پیدا نشود یا غیرفعال باشد یا ایمیل تایید نشده باشد
    """
    # بررسی وجود کاربر
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("کاربری با این ایمیل یافت نشد")
    
    if not user.is_active:
        raise ValueError("حساب کاربری شما غیرفعال شده است")
    
    # بررسی تایید ایمیل
    if not user.email_verified:
        raise ValueError("ابتدا باید ایمیل خود را تایید کنید")
    
    # تولید OTP
    otp_code = generate_otp()
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # ذخیره در دیتابیس
    await user_repo.update_otp(db, email, otp_code, otp_expires_at)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="login_attempt",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email, "method": "otp"}
    )
    
    await db.commit()
    
    # ارسال ایمیل - اولویت با زبان ارسالی، سپس preferred_language کاربر
    email_language = language or user.preferred_language
    send_otp_email(email, otp_code, language=email_language)
    
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
        ValueError: اگر OTP نامعتبر یا منقضی شده باشد
    """
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("کاربری با این ایمیل یافت نشد")
    
    if not user.is_active:
        raise ValueError("حساب کاربری شما غیرفعال شده است")
    
    if not user.email_verified:
        raise ValueError("ابتدا باید ایمیل خود را تایید کنید")
    
    # بررسی OTP
    if not user.otp_code or user.otp_code != otp_code:
        raise ValueError("کد OTP نامعتبر است")
    
    # بررسی انقضای OTP
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise ValueError("کد OTP منقضی شده است")
    
    # پاک کردن OTP بعد از استفاده (single-use)
    await user_repo.update_otp(db, email, None, None)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="login_success",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email, "method": "otp"}
    )
    
    await db.commit()
    
    logger.info(f"User logged in via OTP: {email}")
    return user


async def login_with_password(
    db: AsyncSession,
    email: str,
    password: str,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """ورود با رمز عبور.
    
    Args:
        db: Database session
        email: آدرس ایمیل
        password: رمز عبور
        ip: آدرس IP
        user_agent: User-Agent
        
    Returns:
        کاربر وارد شده
        
    Raises:
        ValueError: اگر اطلاعات نادرست باشد
    """
    user = await user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("ایمیل یا رمز عبور نادرست است")
    
    if not user.is_active:
        raise ValueError("حساب کاربری شما غیرفعال شده است")
    
    if not user.email_verified:
        raise ValueError("ابتدا باید ایمیل خود را تایید کنید")
    
    # بررسی password
    if not user.password:
        raise ValueError("رمز عبور تنظیم نشده است")
    
    if not verify_password(password, user.password):
        raise ValueError("ایمیل یا رمز عبور نادرست است")
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="login_success",
        actor_user_id=user.id,
        ip=ip,
        user_agent=user_agent,
        payload={"email": email, "method": "password"}
    )
    
    await db.commit()
    
    logger.info(f"User logged in via password: {email}")
    return user


def create_tokens(user_id: int, email: str) -> Dict[str, Union[str, int]]:
    """تولید JWT tokens برای کاربر.
    
    Args:
        user_id: شناسه کاربر
        email: ایمیل کاربر
        
    Returns:
        dict حاوی access_token, refresh_token و expires_in
    """
    # تولید access token
    access_token = create_access_token(
        data={"user_id": user_id, "email": email},
        secret=settings.SECRET_KEY,
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    # تولید refresh token
    refresh_token = create_refresh_token(
        data={"user_id": user_id, "email": email},
        secret=settings.SECRET_KEY,
        expires_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


def refresh_access_token(refresh_token: str) -> Dict[str, Union[str, int]]:
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
        
        # تولید access token و refresh token جدید
        access_token = create_access_token(
            data={"user_id": user_id, "email": email},
            secret=settings.SECRET_KEY,
            expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        # تولید refresh token جدید برای token rotation
        new_refresh_token = create_refresh_token(
            data={"user_id": user_id, "email": email},
            secret=settings.SECRET_KEY,
            expires_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        logger.warning(f"Failed to refresh token: {e}")
        raise ValueError("Refresh token نامعتبر است")

