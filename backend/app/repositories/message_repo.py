"""Message repository برای دسترسی به دیتابیس."""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.message import Message
from ..utils.pagination import calculate_offset


async def create(
    db: AsyncSession,
    sender_id: int,
    receiver_id: int,
    body: str
) -> Message:
    """ساخت پیام جدید.
    
    Args:
        db: Database session
        sender_id: شناسه فرستنده
        receiver_id: شناسه گیرنده
        body: متن پیام
        
    Returns:
        Message ایجادشده با relationshipهای load شده
    """
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        body=body
    )
    
    db.add(message)
    await db.flush()
    await db.refresh(message)
    
    # بازگرفتن پیام با relationshipها
    query = (
        select(Message)
        .where(Message.id == message.id)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        )
    )
    result = await db.execute(query)
    return result.scalar_one()


async def get_inbox(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int
) -> tuple[list[Message], int]:
    """دریافت پیام‌های دریافتی (paginated).
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست پیام‌ها، تعداد کل)
    """
    # Count total
    count_query = select(func.count(Message.id)).where(Message.receiver_id == user_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch messages
    offset = calculate_offset(page, page_size)
    query = (
        select(Message)
        .where(Message.receiver_id == user_id)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        )
        .order_by(Message.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    messages = list(result.scalars().all())
    
    return messages, total


async def get_sent(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int
) -> tuple[list[Message], int]:
    """دریافت پیام‌های ارسالی (paginated).
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست پیام‌ها، تعداد کل)
    """
    # Count total
    count_query = select(func.count(Message.id)).where(Message.sender_id == user_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch messages
    offset = calculate_offset(page, page_size)
    query = (
        select(Message)
        .where(Message.sender_id == user_id)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        )
        .order_by(Message.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    messages = list(result.scalars().all())
    
    return messages, total


async def get_conversation(
    db: AsyncSession,
    user_id: int,
    other_user_id: int,
    page: int,
    page_size: int
) -> tuple[list[Message], int]:
    """دریافت تمام پیام‌های رد و بدل شده بین دو کاربر (conversation).
    
    Args:
        db: Database session
        user_id: شناسه کاربر اول
        other_user_id: شناسه کاربر دوم
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست پیام‌ها، تعداد کل)
    """
    from sqlalchemy import or_, and_
    
    # پیام‌هایی که بین این دو کاربر رد و بدل شده
    condition = or_(
        and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
        and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
    )
    
    # Count total
    count_query = select(func.count(Message.id)).where(condition)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch messages
    offset = calculate_offset(page, page_size)
    query = (
        select(Message)
        .where(condition)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        )
        .order_by(Message.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    messages = list(result.scalars().all())
    
    return messages, total


async def get_conversations(
    db: AsyncSession,
    user_id: int
) -> list[dict]:
    """دریافت لیست مکالمات کاربر با آخرین پیام و تعداد پیام‌های خوانده نشده.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        
    Returns:
        لیست dictionary شامل اطلاعات هر مکالمه
    """
    from sqlalchemy import or_, and_, case, distinct
    from ..models.user import User
    
    # یافتن تمام کاربرانی که با آن‌ها پیام رد و بدل شده
    # برای هر کاربر، آخرین پیام و تعداد پیام‌های خوانده نشده
    
    # ابتدا تمام پیام‌های مرتبط با کاربر را پیدا می‌کنیم
    messages_query = (
        select(Message)
        .where(
            or_(
                Message.sender_id == user_id,
                Message.receiver_id == user_id
            )
        )
        .options(
            selectinload(Message.sender),
            selectinload(Message.receiver)
        )
        .order_by(Message.created_at.desc())
    )
    
    result = await db.execute(messages_query)
    all_messages = list(result.scalars().all())
    
    # گروه‌بندی پیام‌ها بر اساس کاربر مقابل
    conversations = {}
    
    for message in all_messages:
        # تشخیص کاربر مقابل
        other_user_id = message.receiver_id if message.sender_id == user_id else message.sender_id
        other_user = message.receiver if message.sender_id == user_id else message.sender
        
        if other_user_id not in conversations:
            conversations[other_user_id] = {
                'user': other_user,
                'last_message': message,
                'unread_count': 0  # TODO: پیاده‌سازی is_read در آینده
            }
    
    # تبدیل به لیست و مرتب‌سازی بر اساس آخرین پیام
    result_list = list(conversations.values())
    result_list.sort(key=lambda x: x['last_message'].created_at, reverse=True)
    
    return result_list

