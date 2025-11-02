"""Card repository برای دسترسی به دیتابیس."""
from typing import Optional
from datetime import datetime
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models.card import Card, CardCommunity
from ..schemas.card import CardFilter
from ..utils.pagination import calculate_offset


async def get_all(
    db: AsyncSession,
    filters: CardFilter,
    page: int,
    page_size: int
) -> tuple[list[Card], int]:
    """دریافت لیست کارت‌ها با فیلتر (paginated).
    
    Args:
        db: Database session
        filters: فیلترهای جست‌وجو
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        tuple از (لیست کارت‌ها، تعداد کل)
    """
    # ساخت query پایه
    query = select(Card)
    count_query = select(func.count(Card.id))
    
    # اعمال فیلترها
    conditions = []
    
    if filters.origin_city_id is not None:
        conditions.append(Card.origin_city_id == filters.origin_city_id)
    
    if filters.destination_city_id is not None:
        conditions.append(Card.destination_city_id == filters.destination_city_id)
    
    if filters.is_sender is not None:
        conditions.append(Card.is_sender == filters.is_sender)
    
    if filters.product_classification_id is not None:
        conditions.append(Card.product_classification_id == filters.product_classification_id)
    
    if filters.is_packed is not None:
        conditions.append(Card.is_packed == filters.is_packed)
    
    # فیلتر بازه زمانی
    if filters.start_date is not None:
        # برای کارت‌های sender: بررسی start_time_frame
        # برای کارت‌های traveler: بررسی ticket_date_time
        conditions.append(
            or_(
                and_(
                    Card.is_sender == True,
                    Card.start_time_frame >= filters.start_date
                ),
                and_(
                    Card.is_sender == False,
                    Card.ticket_date_time >= filters.start_date
                )
            )
        )
    
    if filters.end_date is not None:
        conditions.append(
            or_(
                and_(
                    Card.is_sender == True,
                    Card.end_time_frame <= filters.end_date
                ),
                and_(
                    Card.is_sender == False,
                    Card.ticket_date_time <= filters.end_date
                )
            )
        )
    
    # فیلتر وزن
    if filters.min_weight is not None:
        conditions.append(Card.weight >= filters.min_weight)
    
    if filters.max_weight is not None:
        conditions.append(Card.weight <= filters.max_weight)
    
    # فیلتر کامیونیتی
    if filters.community_id is not None:
        # کارت‌هایی که در CardCommunity با این community_id هستند
        # یا کارت‌هایی که اصلاً در CardCommunity نیستند (سراسری)
        subquery = select(CardCommunity.card_id).where(
            CardCommunity.community_id == filters.community_id
        )
        no_community_subquery = select(CardCommunity.card_id)
        
        conditions.append(
            or_(
                Card.id.in_(subquery),
                Card.id.not_in(no_community_subquery)
            )
        )
    
    # اعمال شرایط به query
    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
    # Count total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Fetch cards با eager loading
    offset = calculate_offset(page, page_size)
    query = (
        query
        .options(
            selectinload(Card.owner),
            selectinload(Card.origin_country),
            selectinload(Card.origin_city),
            selectinload(Card.destination_country),
            selectinload(Card.destination_city),
            selectinload(Card.product_classification)
        )
        .order_by(Card.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    cards = list(result.scalars().all())
    
    return cards, total


async def get_by_id(
    db: AsyncSession,
    card_id: int
) -> Optional[Card]:
    """دریافت کارت با ID.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        
    Returns:
        کارت یا None
    """
    query = (
        select(Card)
        .where(Card.id == card_id)
        .options(
            selectinload(Card.owner),
            selectinload(Card.origin_country),
            selectinload(Card.origin_city),
            selectinload(Card.destination_country),
            selectinload(Card.destination_city),
            selectinload(Card.product_classification)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    owner_id: int,
    **card_data
) -> Card:
    """ساخت کارت جدید.
    
    Args:
        db: Database session
        owner_id: شناسه صاحب کارت
        **card_data: داده‌های کارت
        
    Returns:
        کارت ایجادشده
    """
    card = Card(owner_id=owner_id, **card_data)
    
    db.add(card)
    await db.flush()
    await db.refresh(card)
    
    return card


async def update_card(
    db: AsyncSession,
    card_id: int,
    **updates
) -> Optional[Card]:
    """آپدیت اطلاعات کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        کارت آپدیت‌شده یا None
    """
    stmt = (
        update(Card)
        .where(Card.id == card_id)
        .values(**updates)
        .returning(Card)
    )
    result = await db.execute(stmt)
    await db.flush()
    
    return result.scalar_one_or_none()


async def delete_card(
    db: AsyncSession,
    card_id: int
) -> bool:
    """حذف کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        
    Returns:
        True در صورت موفقیت
    """
    stmt = delete(Card).where(Card.id == card_id)
    result = await db.execute(stmt)
    await db.flush()
    
    return result.rowcount > 0


async def add_communities(
    db: AsyncSession,
    card_id: int,
    community_ids: list[int]
) -> bool:
    """اتصال کارت به کامیونیتی‌ها.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        community_ids: لیست شناسه‌های کامیونیتی
        
    Returns:
        True در صورت موفقیت
    """
    # حذف اتصالات قبلی
    await db.execute(
        delete(CardCommunity).where(CardCommunity.card_id == card_id)
    )
    
    # اضافه کردن اتصالات جدید
    for community_id in community_ids:
        card_community = CardCommunity(
            card_id=card_id,
            community_id=community_id
        )
        db.add(card_community)
    
    await db.flush()
    return True


async def get_card_communities(
    db: AsyncSession,
    card_id: int
) -> list[int]:
    """دریافت کامیونیتی‌های کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        
    Returns:
        لیست شناسه‌های کامیونیتی
    """
    query = select(CardCommunity.community_id).where(CardCommunity.card_id == card_id)
    result = await db.execute(query)
    return list(result.scalars().all())

