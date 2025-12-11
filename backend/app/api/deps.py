"""FastAPI dependencies for DB, auth, and rate limiting."""
from typing import AsyncGenerator, Annotated, Optional, Dict
from fastapi import Depends, HTTPException, status, Request, Header
from ..core.config import get_settings
from ..core.security import decode_token
from ..core.rate_limit import get_rate_limiter, check_rate_limit


settings = get_settings()


# ==================== Database Dependencies ====================

# استفاده مستقیم از core.database.get_db برای اینکه dependency override در تست‌ها کار کند
from ..core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

# Type alias برای استفاده راحت‌تر
DBSession = Annotated[AsyncSession, Depends(get_db)]


# ==================== Redis Dependencies ====================

async def get_redis():
    """دریافت Redis connection.
    
    TODO: پیاده‌سازی واقعی با aioredis
    
    Returns:
        Redis connection
    """
    # Placeholder - زمانی که Redis client setup شد
    # from ..db.redis import redis_client
    # return redis_client
    return None


RedisClient = Annotated[None, Depends(get_redis)]


# ==================== Authentication Dependencies ====================

async def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[Dict]:
    """دریافت کاربر فعلی از JWT token (اختیاری).
    
    Args:
        request: درخواست FastAPI
        authorization: هدر Authorization
        
    Returns:
        اطلاعات کاربر یا None
    """
    from ..utils.logger import logger
    
    if not authorization:
        logger.debug(f"No authorization header for {request.url.path}")
        request.state.user = None
        return None
    
    if not authorization.startswith("Bearer "):
        logger.warning(f"Invalid authorization format for {request.url.path}")
        request.state.user = None
        return None
    
    token = authorization.removeprefix("Bearer ")
    
    # TODO: استفاده از SECRET_KEY از تنظیمات
    # فعلاً یک secret ثابت برای تست
    secret = getattr(settings, "SECRET_KEY", "dev-secret-key-change-in-production")
    
    payload = decode_token(token, secret)
    
    if payload:
        logger.debug(f"Token decoded successfully for user_id={payload.get('user_id')}, path={request.url.path}")
    else:
        logger.warning(f"Token decode failed for {request.url.path}")
    
    # ذخیره user در request state برای rate limiting
    request.state.user = payload
    
    return payload


async def get_current_user(
    user: Optional[Dict] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """دریافت کاربر فعلی (الزامی).
    
    Args:
        user: کاربر از dependency اختیاری
        db: Database session
        
    Returns:
        اطلاعات کاربر
        
    Raises:
        HTTPException: 401 اگر توکن نامعتبر یا نداشته باشد
        HTTPException: 403 اگر ایمیل تایید نشده باشد
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # بررسی email_verified از دیتابیس
    from ..repositories import user_repo
    user_obj = await user_repo.get_by_id(db, user["user_id"])
    
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کاربر یافت نشد",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_obj.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ابتدا باید ایمیل خود را تایید کنید"
        )
    
    if not user_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="حساب کاربری شما غیرفعال شده است"
        )
    
    return user


# Type aliases
CurrentUser = Annotated[Dict, Depends(get_current_user)]
CurrentUserOptional = Annotated[Optional[Dict], Depends(get_current_user_optional)]


# ==================== Rate Limiting Dependencies ====================

async def verify_message_rate_limit(request: Request) -> None:
    """بررسی محدودیت ارسال پیام روزانه.
    
    Args:
        request: درخواست FastAPI
        
    Raises:
        HTTPException: 429 اگر محدودیت تجاوز شده باشد
    """
    limit = settings.MESSAGES_PER_DAY
    await check_rate_limit(
        request,
        limit=limit,
        window_seconds=86400,  # 24 hours
        key_prefix="msg"
    )


async def verify_api_rate_limit(request: Request) -> None:
    """بررسی محدودیت کلی API.
    
    Args:
        request: درخواست FastAPI
        
    Raises:
        HTTPException: 429 اگر محدودیت تجاوز شده باشد
    """
    await check_rate_limit(
        request,
        limit=100,  # 100 درخواست در دقیقه
        window_seconds=60,
        key_prefix="api"
    )


# Type aliases for rate limiting
MessageRateLimit = Annotated[None, Depends(verify_message_rate_limit)]
APIRateLimit = Annotated[None, Depends(verify_api_rate_limit)]


# ==================== Admin Dependencies ====================

async def get_admin_user(
    user: Dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """بررسی دسترسی ادمین.
    
    Args:
        user: کاربر فعلی
        db: Database session
        
    Returns:
        اطلاعات کاربر ادمین
        
    Raises:
        HTTPException: 403 اگر کاربر ادمین نباشد
    """
    from ..repositories import user_repo
    user_obj = await user_repo.get_by_id(db, user["user_id"])
    
    if not user_obj or not user_obj.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی ادمین الزامی است"
        )
    
    return user


# Type alias for admin
AdminUser = Annotated[Dict, Depends(get_admin_user)]

