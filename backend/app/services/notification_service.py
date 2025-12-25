"""Smart Notification Service.

قوانین هوشمند برای ارسال ایمیل:
1. فقط اولین پیام خوانده نشده از هر فرستنده → ایمیل
2. پیام‌های بعدی از همان فرستنده → بدون ایمیل (تا زمانی که اولی خوانده شود)
3. استفاده از Redis برای ردیابی (با TTL 24 ساعته)
"""
import redis.asyncio as redis
from typing import Optional
from ..core.config import get_settings
from ..utils.email import send_message_notification
from ..utils.logger import logger

settings = get_settings()

# Redis key patterns
# notification:sent:{receiver_id}:{sender_id} = timestamp
# این کلید نشان می‌دهد که ایمیل برای پیام از sender_id به receiver_id فرستاده شده

NOTIFICATION_KEY_PREFIX = "notification:sent"
NOTIFICATION_TTL = 60 * 60 * 24  # 24 hours


async def get_redis_client() -> redis.Redis:
    """دریافت Redis client."""
    return redis.from_url(settings.REDIS_URL)


async def should_send_notification(receiver_id: int, sender_id: int) -> bool:
    """بررسی اینکه آیا باید ایمیل notification فرستاد.
    
    قوانین:
    - اگر قبلاً برای این جفت sender/receiver ایمیل فرستاده نشده → True
    - اگر فرستاده شده و 24 ساعت نگذشته → False
    
    Args:
        receiver_id: شناسه گیرنده پیام
        sender_id: شناسه فرستنده پیام
        
    Returns:
        True اگر باید ایمیل بفرستد
    """
    try:
        client = await get_redis_client()
        key = f"{NOTIFICATION_KEY_PREFIX}:{receiver_id}:{sender_id}"
        
        exists = await client.exists(key)
        await client.aclose()
        
        return not exists
        
    except Exception as e:
        logger.warning(f"Redis check failed, defaulting to send: {e}")
        return True  # در صورت خطا، ایمیل بفرست


async def mark_notification_sent(receiver_id: int, sender_id: int) -> None:
    """ثبت اینکه ایمیل notification فرستاده شد.
    
    Args:
        receiver_id: شناسه گیرنده پیام
        sender_id: شناسه فرستنده پیام
    """
    try:
        client = await get_redis_client()
        key = f"{NOTIFICATION_KEY_PREFIX}:{receiver_id}:{sender_id}"
        
        await client.setex(key, NOTIFICATION_TTL, "1")
        await client.aclose()
        
        logger.debug(f"Marked notification sent: {sender_id} → {receiver_id}")
        
    except Exception as e:
        logger.warning(f"Failed to mark notification in Redis: {e}")


async def clear_notification_flag(receiver_id: int, sender_id: int) -> None:
    """پاک کردن flag notification (وقتی پیام‌ها خوانده شدند).
    
    Args:
        receiver_id: شناسه گیرنده پیام
        sender_id: شناسه فرستنده پیام
    """
    try:
        client = await get_redis_client()
        key = f"{NOTIFICATION_KEY_PREFIX}:{receiver_id}:{sender_id}"
        
        await client.delete(key)
        await client.aclose()
        
        logger.debug(f"Cleared notification flag: {sender_id} → {receiver_id}")
        
    except Exception as e:
        logger.warning(f"Failed to clear notification flag: {e}")


async def send_smart_notification(
    receiver_email: str,
    receiver_id: int,
    receiver_language: str,
    receiver_first_name: str,
    sender_id: int,
    sender_name: str,
    app_url: str = "https://minila.app"
) -> bool:
    """ارسال ایمیل notification هوشمند.
    
    فقط ایمیل می‌فرستد اگر:
    - قبلاً برای این جفت فرستنده/گیرنده ایمیل نفرستاده باشیم
    
    Args:
        receiver_email: ایمیل گیرنده
        receiver_id: شناسه گیرنده
        receiver_language: زبان ترجیحی گیرنده
        receiver_first_name: نام گیرنده
        sender_id: شناسه فرستنده
        sender_name: نام فرستنده
        app_url: آدرس اپلیکیشن
        
    Returns:
        True اگر ایمیل فرستاده شد یا نیازی نبود
    """
    # بررسی اینکه آیا باید ایمیل بفرستیم
    should_send = await should_send_notification(receiver_id, sender_id)
    
    if not should_send:
        logger.debug(
            f"Skipping notification: already sent for {sender_id} → {receiver_id}"
        )
        return True
    
    # ارسال ایمیل
    success = send_message_notification(
        email=receiver_email,
        sender_name=sender_name,
        first_name=receiver_first_name,
        language=receiver_language,
        app_url=app_url
    )
    
    if success:
        # ثبت اینکه ایمیل فرستاده شد
        await mark_notification_sent(receiver_id, sender_id)
        logger.info(f"Notification sent: {sender_id} → {receiver_id}")
    else:
        logger.warning(f"Notification failed: {sender_id} → {receiver_id}")
    
    return success

