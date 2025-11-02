"""FastAPI dependencies for DB, auth, and rate limiting."""
from typing import AsyncGenerator, Annotated
from fastapi import Depends, HTTPException, status, Request, Header
from ..core.config import get_settings
from ..core.security import decode_token
from ..core.rate_limit import get_rate_limiter, check_rate_limit


settings = get_settings()


# ==================== Database Dependencies ====================

async def get_db() -> AsyncGenerator:
    """دریافت database session.
    
    Yields:
        DB session
    """
    from ..core.database import get_db as _get_db
    async for session in _get_db():
        yield session


# Type alias برای استفاده راحت‌تر
from sqlalchemy.ext.asyncio import AsyncSession
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
    authorization: str | None = Header(None)
) -> dict | None:
    """دریافت کاربر فعلی از JWT token (اختیاری).
    
    Args:
        authorization: هدر Authorization
        
    Returns:
        اطلاعات کاربر یا None
    """
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        return None
    
    token = authorization.removeprefix("Bearer ")
    
    # TODO: استفاده از SECRET_KEY از تنظیمات
    # فعلاً یک secret ثابت برای تست
    secret = getattr(settings, "SECRET_KEY", "dev-secret-key-change-in-production")
    
    payload = decode_token(token, secret)
    return payload


async def get_current_user(
    user: dict | None = Depends(get_current_user_optional)
) -> dict:
    """دریافت کاربر فعلی (الزامی).
    
    Args:
        user: کاربر از dependency اختیاری
        
    Returns:
        اطلاعات کاربر
        
    Raises:
        HTTPException: 401 اگر توکن نامعتبر یا نداشته باشد
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# Type aliases
CurrentUser = Annotated[dict, Depends(get_current_user)]
CurrentUserOptional = Annotated[dict | None, Depends(get_current_user_optional)]


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

