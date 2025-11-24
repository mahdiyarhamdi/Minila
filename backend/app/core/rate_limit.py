"""Rate limiting utilities with Redis support (placeholder for slowapi)."""
from typing import Callable, Optional, Dict, List
from fastapi import Request, HTTPException, status


# Placeholder برای Redis connection
# در آینده با redis-py یا aioredis جایگزین می‌شود
class RedisRateLimiter:
    """محدودساز نرخ با Redis (placeholder)."""
    
    def __init__(self, redis_url: str):
        """مقداردهی اولیه.
        
        Args:
            redis_url: آدرس Redis
        """
        self.redis_url = redis_url
        # TODO: اتصال به Redis زمانی که redis-py نصب شد
        self._store: Dict[str, List[float]] = {}  # In-memory برای الان
    
    async def check_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int = 86400  # 24 hours
    ) -> bool:
        """بررسی محدودیت نرخ.
        
        Args:
            key: کلید یکتا (user_id یا IP)
            limit: تعداد مجاز درخواست
            window_seconds: پنجره زمانی به ثانیه
            
        Returns:
            True اگر اجازه داشته باشد، False اگر محدود شده
        """
        # TODO: پیاده‌سازی واقعی با Redis
        # فعلاً یک in-memory ساده
        import time
        current_time = time.time()
        
        if key not in self._store:
            self._store[key] = []
        
        # حذف درخواست‌های قدیمی
        cutoff_time = current_time - window_seconds
        self._store[key] = [
            req_time for req_time in self._store[key]
            if req_time > cutoff_time
        ]
        
        # بررسی محدودیت
        if len(self._store[key]) >= limit:
            return False
        
        # ثبت درخواست جدید
        self._store[key].append(current_time)
        return True
    
    async def get_remaining(self, key: str, limit: int, window_seconds: int = 86400) -> int:
        """دریافت تعداد درخواست باقی‌مانده.
        
        Args:
            key: کلید یکتا
            limit: تعداد مجاز
            window_seconds: پنجره زمانی
            
        Returns:
            تعداد درخواست باقی‌مانده
        """
        import time
        current_time = time.time()
        
        if key not in self._store:
            return limit
        
        cutoff_time = current_time - window_seconds
        recent_requests = [
            req_time for req_time in self._store[key]
            if req_time > cutoff_time
        ]
        
        return max(0, limit - len(recent_requests))


# Instance سراسری (در main.py مقداردهی می‌شود)
rate_limiter: Optional[RedisRateLimiter] = None


def init_rate_limiter(redis_url: str) -> RedisRateLimiter:
    """مقداردهی اولیه rate limiter.
    
    Args:
        redis_url: آدرس Redis
        
    Returns:
        نمونه RedisRateLimiter
    """
    global rate_limiter
    rate_limiter = RedisRateLimiter(redis_url)
    return rate_limiter


def get_rate_limiter() -> RedisRateLimiter:
    """دریافت rate limiter سراسری.
    
    Returns:
        نمونه RedisRateLimiter
        
    Raises:
        RuntimeError: اگر rate limiter مقداردهی نشده باشد
    """
    if rate_limiter is None:
        raise RuntimeError("Rate limiter not initialized. Call init_rate_limiter() first.")
    return rate_limiter


async def check_rate_limit(
    request: Request,
    limit: int,
    window_seconds: int = 86400,
    key_prefix: str = "rl"
) -> None:
    """بررسی محدودیت نرخ برای درخواست.
    
    Args:
        request: درخواست FastAPI
        limit: تعداد مجاز
        window_seconds: پنجره زمانی
        key_prefix: پیشوند کلید
        
    Raises:
        HTTPException: 429 اگر محدودیت تجاوز کرده باشد
    """
    limiter = get_rate_limiter()
    
    # استفاده از user_id اگر authenticated باشد، وگرنه IP
    identifier = "unknown"
    if hasattr(request.state, "user") and request.state.user:
        identifier = str(request.state.user.get("user_id", "unknown"))
    elif request.client:
        identifier = request.client.host
    
    key = f"{key_prefix}:{identifier}"
    
    allowed = await limiter.check_limit(key, limit, window_seconds)
    
    if not allowed:
        remaining = await limiter.get_remaining(key, limit, window_seconds)
        hours_left = int(window_seconds / 3600)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"شما به محدودیت روزانه رسیده‌اید. می‌توانید حداکثر {limit} پیام در روز ارسال کنید. لطفاً {hours_left} ساعت دیگر دوباره امتحان کنید."
        )


def create_rate_limit_dependency(
    limit: int,
    window_seconds: int = 86400,
    key_prefix: str = "rl"
) -> Callable:
    """ساخت dependency برای محدودسازی نرخ.
    
    Args:
        limit: تعداد مجاز درخواست
        window_seconds: پنجره زمانی
        key_prefix: پیشوند کلید
        
    Returns:
        تابع dependency
    """
    async def dependency(request: Request) -> None:
        await check_rate_limit(request, limit, window_seconds, key_prefix)
    
    return dependency

