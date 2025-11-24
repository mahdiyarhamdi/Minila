"""Message service برای منطق پیام‌رسانی."""
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.message import Message
from ..repositories import message_repo, community_repo, user_repo
from ..services import log_service
from ..utils.pagination import PaginatedResponse
from ..utils.email import send_message_notification
from ..utils.logger import logger


async def send_message(
    db: AsyncSession,
    sender_id: int,
    receiver_id: int,
    body: str
):
    """ارسال پیام به کاربر.
    
    Args:
        db: Database session
        sender_id: شناسه فرستنده
        receiver_id: شناسه گیرنده
        body: متن پیام
        
    Returns:
        Message ایجادشده
        
    Raises:
        ValueError: اگر گیرنده یافت نشود یا خود کاربر باشد
        PermissionError: اگر کامیونیتی مشترک نداشته باشند
    """
    # بررسی عدم ارسال به خود
    if sender_id == receiver_id:
        raise ValueError("نمی‌توانید به خودتان پیام ارسال کنید")
    
    # بررسی وجود گیرنده
    receiver = await user_repo.get_by_id(db, receiver_id)
    if not receiver:
        raise ValueError("گیرنده پیام یافت نشد")
    
    if not receiver.is_active:
        raise ValueError("گیرنده پیام غیرفعال است")
    
    # بررسی کامیونیتی مشترک (قید اصلی SCOPE)
    has_common = await community_repo.check_common_membership(db, sender_id, receiver_id)
    if not has_common:
        # ثبت لاگ برای تلاش ناموفق
        await log_service.log_event(
            db,
            event_type="message_blocked",
            actor_user_id=sender_id,
            target_user_id=receiver_id,
            payload={"reason": "no_common_community"}
        )
        raise PermissionError("شما و گیرنده پیام هیچ کامیونیتی مشترکی ندارید")
    
    # TODO: بررسی user block (اگر گیرنده فرستنده را بلاک کرده باشد)
    # این بخش در آینده پیاده‌سازی می‌شود
    
    # ساخت پیام
    message = await message_repo.create(
        db,
        sender_id=sender_id,
        receiver_id=receiver_id,
        body=body
    )
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="message_send",
        actor_user_id=sender_id,
        target_user_id=receiver_id,
        payload={"message_id": message.id}
    )
    
    await db.commit()
    
    # ارسال ایمیل notification
    try:
        sender = await user_repo.get_by_id(db, sender_id)
        sender_name = f"{sender.first_name} {sender.last_name}" if sender.first_name else sender.email
        send_message_notification(
            receiver.email,
            sender_name,
            "پیام جدید"
        )
    except Exception as e:
        logger.warning(f"Failed to send message notification email: {e}")
    
    logger.info(f"Message sent: {sender_id} → {receiver_id}")
    return message


async def get_inbox(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int
):
    """دریافت پیام‌های دریافتی.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از Message
    """
    messages, total = await message_repo.get_inbox(db, user_id, page, page_size)
    
    return PaginatedResponse.create(
        items=messages,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_sent(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int
):
    """دریافت پیام‌های ارسالی.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از Message
    """
    messages, total = await message_repo.get_sent(db, user_id, page, page_size)
    
    return PaginatedResponse.create(
        items=messages,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_conversation(
    db: AsyncSession,
    user_id: int,
    other_user_id: int,
    page: int,
    page_size: int
):
    """دریافت تمام پیام‌های رد و بدل شده با یک کاربر خاص (conversation).
    
    Args:
        db: Database session
        user_id: شناسه کاربر فعلی
        other_user_id: شناسه کاربر مقابل
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از Message
        
    Raises:
        ValueError: اگر کاربر مقابل یافت نشود
    """
    # بررسی وجود کاربر مقابل
    other_user = await user_repo.get_by_id(db, other_user_id)
    if not other_user:
        raise ValueError("کاربر مورد نظر یافت نشد")
    
    messages, total = await message_repo.get_conversation(
        db, user_id, other_user_id, page, page_size
    )
    
    return PaginatedResponse.create(
        items=messages,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_conversations(
    db: AsyncSession,
    user_id: int
):
    """دریافت لیست مکالمات کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        dict شامل لیست مکالمات و تعداد کل
    """
    conversations = await message_repo.get_conversations(db, user_id)
    
    return {
        "items": conversations,
        "total": len(conversations)
    }


async def mark_conversation_as_read(
    db: AsyncSession,
    user_id: int,
    other_user_id: int
):
    """علامت‌گذاری تمام پیام‌های یک مکالمه به عنوان خوانده شده.
    
    Args:
        db: Database session
        user_id: شناسه کاربر فعلی
        other_user_id: شناسه کاربر مقابل
        
    Returns:
        تعداد پیام‌هایی که mark شدند
        
    Raises:
        ValueError: اگر کاربر مقابل یافت نشود
    """
    # بررسی وجود کاربر مقابل
    other_user = await user_repo.get_by_id(db, other_user_id)
    if not other_user:
        raise ValueError("کاربر مورد نظر یافت نشد")
    
    # علامت‌گذاری پیام‌ها به عنوان خوانده شده
    count = await message_repo.mark_as_read(db, user_id, other_user_id)
    
    # ثبت لاگ اگر پیامی mark شده باشد
    if count > 0:
        await log_service.log_event(
            db,
            event_type="message_read",
            actor_user_id=user_id,
            target_user_id=other_user_id,
            payload={"count": count}
        )
    
    logger.info(f"Marked {count} messages as read: {other_user_id} → {user_id}")
    return count


async def get_total_unread_count(
    db: AsyncSession,
    user_id: int
) -> int:
    """دریافت تعداد کل پیام‌های خوانده نشده کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        تعداد کل پیام‌های خوانده نشده
    """
    return await message_repo.get_total_unread_count(db, user_id)

