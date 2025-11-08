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

