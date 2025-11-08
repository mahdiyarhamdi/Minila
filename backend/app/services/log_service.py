"""Service برای ثبت رویدادها در جدول Log."""
import json
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from ..models.log import Log
from ..utils.logger import logger


async def log_event(
    db: AsyncSession,
    event_type: str,
    actor_user_id: Optional[int] = None,
    target_user_id: Optional[int] = None,
    card_id: Optional[int] = None,
    community_id: Optional[int] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    payload: Optional[dict[str, Any]] = None
) -> Log:
    """ثبت رویداد در جدول Log.
    
    Args:
        db: Database session
        event_type: نوع رویداد (signup, login, card_create, message_send, ...)
        actor_user_id: ID کاربری که اقدام را انجام داده
        target_user_id: ID کاربر هدف (اگر وجود دارد)
        card_id: ID کارت مرتبط (اگر وجود دارد)
        community_id: ID کامیونیتی مرتبط (اگر وجود دارد)
        ip: آدرس IP
        user_agent: User-Agent string
        payload: اطلاعات اضافی (JSON)
        
    Returns:
        Log: رکورد لاگ ایجادشده
        
    Example:
        await log_event(
            db,
            event_type="signup",
            actor_user_id=user.id,
            ip=request.client.host,
            payload={"email": user.email}
        )
    """
    try:
        log_entry = Log(
            event_type=event_type,
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            card_id=card_id,
            community_id=community_id,
            ip=ip,
            user_agent=user_agent,
            payload=json.dumps(payload) if payload else None
        )
        
        db.add(log_entry)
        await db.flush()
        
        # لاگ در stdout هم
        logger.info(
            f"Event logged: {event_type}",
            extra={
                "actor": actor_user_id,
                "target": target_user_id,
                "card": card_id,
                "community": community_id
            }
        )
        
        return log_entry
        
    except Exception as e:
        logger.error(f"Failed to log event {event_type}: {str(e)}")
        # در صورت خطا در logging، exception را propagate نمی‌کنیم
        # چون نباید flow اصلی را مختل کند
        raise


async def get_user_logs(
    db: AsyncSession,
    user_id: int,
    event_type: Optional[str] = None,
    limit: int = 100
) -> list[Log]:
    """دریافت لاگ‌های یک کاربر.
    
    Args:
        db: Database session
        user_id: ID کاربر
        event_type: فیلتر بر اساس نوع رویداد (اختیاری)
        limit: حداکثر تعداد نتایج
        
    Returns:
        لیست لاگ‌ها
    """
    query = select(Log).where(Log.actor_user_id == user_id)
    
    if event_type:
        query = query.where(Log.event_type == event_type)
    
    query = query.order_by(Log.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_logs_by_event(
    db: AsyncSession,
    event_type: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
) -> list[Log]:
    """دریافت لاگ‌ها بر اساس نوع رویداد.
    
    Args:
        db: Database session
        event_type: نوع رویداد
        start_date: تاریخ شروع (اختیاری)
        end_date: تاریخ پایان (اختیاری)
        limit: حداکثر تعداد نتایج
        
    Returns:
        لیست لاگ‌ها
    """
    query = select(Log).where(Log.event_type == event_type)
    
    if start_date:
        query = query.where(Log.created_at >= start_date)
    if end_date:
        query = query.where(Log.created_at <= end_date)
    
    query = query.order_by(Log.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    return list(result.scalars().all())

