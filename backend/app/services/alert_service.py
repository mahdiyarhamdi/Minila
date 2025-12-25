"""Alert Service for admin notifications and monitoring.

ارسال هشدار به ادمین‌ها:
- رخدادهای با اولویت بالا → ایمیل فوری
- رخدادهای عادی → خلاصه روزانه
"""
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.alert import Alert
from ..models.user import User
from ..schemas.alert import AlertType, AlertPriority, AlertCreate, AlertOut, AlertList, AlertStats
from ..utils.email import send_email
from ..utils.logger import logger
from ..core.config import get_settings

settings = get_settings()


async def create_alert(
    db: AsyncSession,
    alert_type: AlertType,
    title: str,
    message: str,
    priority: AlertPriority = AlertPriority.NORMAL,
    metadata: Optional[dict] = None,
    send_email_now: bool = True,
) -> Alert:
    """ایجاد هشدار جدید و ارسال ایمیل در صورت نیاز.
    
    Args:
        db: Database session
        alert_type: نوع هشدار
        title: عنوان
        message: پیام
        priority: اولویت
        metadata: اطلاعات اضافی
        send_email_now: آیا فوراً ایمیل بفرستد (برای اولویت بالا)
    
    Returns:
        Alert object
    """
    alert = Alert(
        type=alert_type.value,
        priority=priority.value,
        title=title,
        message=message,
        metadata=metadata,
        is_read=False,
        email_sent=False,
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    logger.info(f"Alert created: [{alert_type.value}] {title}")
    
    # ارسال ایمیل فوری برای اولویت بالا
    if send_email_now and priority == AlertPriority.HIGH:
        await send_immediate_email(db, alert)
    
    return alert


async def send_immediate_email(db: AsyncSession, alert: Alert) -> bool:
    """ارسال ایمیل فوری به تمام ادمین‌ها.
    
    Args:
        db: Database session
        alert: Alert object
        
    Returns:
        True if at least one email was sent
    """
    try:
        # دریافت لیست ادمین‌ها
        result = await db.execute(
            select(User).where(
                and_(User.is_admin == True, User.is_active == True)
            )
        )
        admins = result.scalars().all()
        
        if not admins:
            logger.warning("No active admins found for alert notification")
            return False
        
        # ساخت ایمیل
        subject = f"🚨 [{_get_priority_label(alert.priority)}] {alert.title}"
        body = _build_alert_email_body(alert)
        
        sent_count = 0
        for admin in admins:
            try:
                if send_email(admin.email, subject, body):
                    sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send alert email to {admin.email}: {e}")
        
        # بروزرسانی وضعیت
        if sent_count > 0:
            alert.email_sent = True
            await db.commit()
            logger.info(f"Alert email sent to {sent_count} admins")
        
        return sent_count > 0
        
    except Exception as e:
        logger.error(f"Failed to send immediate alert email: {e}")
        return False


async def send_daily_digest(db: AsyncSession) -> bool:
    """ارسال خلاصه روزانه به ادمین‌ها.
    
    شامل:
    - هشدارهای خوانده نشده (normal priority)
    - خلاصه آماری
    
    Returns:
        True if successful
    """
    try:
        # دریافت هشدارهای 24 ساعت اخیر که ایمیل نشده‌اند
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        result = await db.execute(
            select(Alert).where(
                and_(
                    Alert.created_at >= yesterday,
                    Alert.email_sent == False,
                )
            ).order_by(Alert.created_at.desc())
        )
        alerts = result.scalars().all()
        
        if not alerts:
            logger.info("No alerts for daily digest")
            return True
        
        # دریافت ادمین‌ها
        result = await db.execute(
            select(User).where(
                and_(User.is_admin == True, User.is_active == True)
            )
        )
        admins = result.scalars().all()
        
        if not admins:
            logger.warning("No active admins for daily digest")
            return False
        
        # ساخت ایمیل خلاصه
        subject = f"📊 خلاصه روزانه مینیلا - {len(alerts)} رخداد"
        body = _build_digest_email_body(alerts)
        
        sent_count = 0
        for admin in admins:
            try:
                if send_email(admin.email, subject, body):
                    sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send digest to {admin.email}: {e}")
        
        # علامت‌گذاری به عنوان ایمیل شده
        if sent_count > 0:
            for alert in alerts:
                alert.email_sent = True
            await db.commit()
            logger.info(f"Daily digest sent to {sent_count} admins with {len(alerts)} alerts")
        
        return sent_count > 0
        
    except Exception as e:
        logger.error(f"Failed to send daily digest: {e}")
        return False


async def get_alerts(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    alert_type: Optional[str] = None,
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
) -> AlertList:
    """دریافت لیست هشدارها با فیلتر و pagination.
    
    Args:
        db: Database session
        page: شماره صفحه
        page_size: تعداد در صفحه
        alert_type: فیلتر نوع
        priority: فیلتر اولویت
        is_read: فیلتر وضعیت خواندن
        
    Returns:
        AlertList with pagination
    """
    # ساخت query
    query = select(Alert)
    count_query = select(func.count(Alert.id))
    
    # اعمال فیلترها
    filters = []
    if alert_type:
        filters.append(Alert.type == alert_type)
    if priority:
        filters.append(Alert.priority == priority)
    if is_read is not None:
        filters.append(Alert.is_read == is_read)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    # اجرای query
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # تعداد خوانده نشده
    unread_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    unread_count = unread_result.scalar() or 0
    
    # دریافت آیتم‌ها
    offset = (page - 1) * page_size
    query = query.order_by(Alert.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return AlertList(
        items=[AlertOut.model_validate(a) for a in alerts],
        total=total,
        page=page,
        page_size=page_size,
        unread_count=unread_count,
    )


async def get_alert_stats(db: AsyncSession) -> AlertStats:
    """دریافت آمار هشدارها.
    
    Returns:
        AlertStats
    """
    # کل
    total_result = await db.execute(select(func.count(Alert.id)))
    total = total_result.scalar() or 0
    
    # خوانده نشده
    unread_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    unread = unread_result.scalar() or 0
    
    # خوانده نشده با اولویت بالا
    high_unread_result = await db.execute(
        select(func.count(Alert.id)).where(
            and_(Alert.is_read == False, Alert.priority == "high")
        )
    )
    high_priority_unread = high_unread_result.scalar() or 0
    
    # تفکیک بر اساس نوع
    type_counts = {}
    for alert_type in AlertType:
        result = await db.execute(
            select(func.count(Alert.id)).where(Alert.type == alert_type.value)
        )
        type_counts[alert_type.value] = result.scalar() or 0
    
    return AlertStats(
        total=total,
        unread=unread,
        high_priority_unread=high_priority_unread,
        by_type=type_counts,
    )


async def mark_as_read(db: AsyncSession, alert_id: int) -> bool:
    """علامت‌گذاری یک هشدار به عنوان خوانده شده.
    
    Args:
        db: Database session
        alert_id: شناسه هشدار
        
    Returns:
        True if successful
    """
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        return False
    
    alert.is_read = True
    await db.commit()
    return True


async def mark_all_as_read(db: AsyncSession) -> int:
    """علامت‌گذاری تمام هشدارها به عنوان خوانده شده.
    
    Returns:
        تعداد هشدارهای به‌روز شده
    """
    result = await db.execute(
        select(Alert).where(Alert.is_read == False)
    )
    alerts = result.scalars().all()
    
    count = 0
    for alert in alerts:
        alert.is_read = True
        count += 1
    
    await db.commit()
    return count


async def get_unread_count(db: AsyncSession) -> int:
    """دریافت تعداد هشدارهای خوانده نشده.
    
    Returns:
        تعداد
    """
    result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    return result.scalar() or 0


# ==================== Helper Functions ====================

def _get_priority_label(priority: str) -> str:
    """تبدیل اولویت به برچسب فارسی."""
    return "فوری" if priority == "high" else "عادی"


def _get_type_label(alert_type: str) -> str:
    """تبدیل نوع به برچسب فارسی."""
    labels = {
        "error": "خطای سیستمی",
        "security": "امنیتی",
        "report": "گزارش کاربر",
        "user": "کاربر",
        "card": "کارت",
        "membership": "عضویت",
    }
    return labels.get(alert_type, alert_type)


def _build_alert_email_body(alert: Alert) -> str:
    """ساخت متن ایمیل هشدار."""
    body = f"""
🚨 هشدار جدید در مینیلا

نوع: {_get_type_label(alert.type)}
اولویت: {_get_priority_label(alert.priority)}
زمان: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}

عنوان: {alert.title}

پیام:
{alert.message}
"""
    
    if alert.metadata:
        body += f"""
اطلاعات اضافی:
{_format_metadata(alert.metadata)}
"""
    
    body += f"""
---
پنل ادمین: https://minila.app/admin/alerts
"""
    return body


def _build_digest_email_body(alerts: list[Alert]) -> str:
    """ساخت متن ایمیل خلاصه روزانه."""
    # تفکیک بر اساس نوع
    by_type = {}
    for alert in alerts:
        if alert.type not in by_type:
            by_type[alert.type] = []
        by_type[alert.type].append(alert)
    
    body = f"""
📊 خلاصه روزانه مینیلا

تعداد کل رخدادها: {len(alerts)}

"""
    
    for alert_type, type_alerts in by_type.items():
        body += f"""
━━━━━━━━━━━━━━━━━━━━━━━━
📌 {_get_type_label(alert_type)} ({len(type_alerts)})
━━━━━━━━━━━━━━━━━━━━━━━━
"""
        for alert in type_alerts[:5]:  # حداکثر 5 تا از هر نوع
            body += f"""
• {alert.title}
  {alert.message[:100]}{'...' if len(alert.message) > 100 else ''}
  زمان: {alert.created_at.strftime('%H:%M')}
"""
        
        if len(type_alerts) > 5:
            body += f"\n  ... و {len(type_alerts) - 5} مورد دیگر\n"
    
    body += """
---
برای مشاهده جزئیات به پنل ادمین مراجعه کنید:
https://minila.app/admin/alerts
"""
    return body


def _format_metadata(metadata: dict) -> str:
    """فرمت metadata برای نمایش در ایمیل."""
    lines = []
    for key, value in metadata.items():
        lines.append(f"  {key}: {value}")
    return "\n".join(lines)


# ==================== Quick Alert Functions ====================

async def alert_error(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار خطای سیستمی (اولویت بالا)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.ERROR,
        title=title,
        message=message,
        priority=AlertPriority.HIGH,
        metadata=metadata,
    )


async def alert_security(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار امنیتی (اولویت بالا)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.SECURITY,
        title=title,
        message=message,
        priority=AlertPriority.HIGH,
        metadata=metadata,
    )


async def alert_report(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار گزارش کاربر (اولویت بالا)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.REPORT,
        title=title,
        message=message,
        priority=AlertPriority.HIGH,
        metadata=metadata,
    )


async def alert_user(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار کاربر جدید (اولویت عادی)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.USER,
        title=title,
        message=message,
        priority=AlertPriority.NORMAL,
        metadata=metadata,
        send_email_now=False,
    )


async def alert_card(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار کارت جدید (اولویت عادی)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.CARD,
        title=title,
        message=message,
        priority=AlertPriority.NORMAL,
        metadata=metadata,
        send_email_now=False,
    )


async def alert_membership(
    db: AsyncSession,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> Alert:
    """ایجاد هشدار درخواست عضویت (اولویت عادی)."""
    return await create_alert(
        db=db,
        alert_type=AlertType.MEMBERSHIP,
        title=title,
        message=message,
        priority=AlertPriority.NORMAL,
        metadata=metadata,
        send_email_now=False,
    )

