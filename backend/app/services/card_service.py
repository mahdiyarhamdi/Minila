"""Card service برای منطق مدیریت کارت‌ها."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.card import Card
from ..repositories import card_repo
from ..schemas.card import CardFilter
from ..services import log_service
from ..utils.pagination import PaginatedResponse
from ..utils.logger import logger


async def get_cards(
    db: AsyncSession,
    filters: CardFilter,
    page: int,
    page_size: int
):
    """دریافت لیست کارت‌ها با فیلتر.
    
    Args:
        db: Database session
        filters: فیلترهای جست‌وجو
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از کارت‌ها
    """
    cards, total = await card_repo.get_all(db, filters, page, page_size)
    
    return PaginatedResponse.create(
        items=cards,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_card(
    db: AsyncSession,
    card_id: int
):
    """دریافت جزئیات کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        
    Returns:
        Card
        
    Raises:
        ValueError: اگر کارت یافت نشود
    """
    card = await card_repo.get_by_id(db, card_id)
    
    if not card:
        raise ValueError("کارت یافت نشد")
    
    return card


async def create_card(
    db: AsyncSession,
    owner_id: int,
    is_sender: bool,
    origin_country_id: int,
    origin_city_id: int,
    destination_country_id: int,
    destination_city_id: int,
    start_time_frame: Optional[str] = None,
    end_time_frame: Optional[str] = None,
    ticket_date_time: Optional[str] = None,
    weight: Optional[float] = None,
    is_packed: Optional[bool] = None,
    price_aed: Optional[float] = None,
    description: Optional[str] = None,
    product_classification_id: Optional[int] = None,
    community_ids: Optional[list[int]] = None
):
    """ایجاد کارت جدید.
    
    Args:
        db: Database session
        owner_id: شناسه صاحب کارت
        is_sender: نوع کارت (true=فرستنده، false=مسافر)
        (سایر پارامترها...)
        community_ids: لیست کامیونیتی‌ها برای نمایش محدود
        
    Returns:
        Card ایجادشده
        
    Raises:
        ValueError: اگر داده‌ها نامعتبر باشند
    """
    # Validation: بررسی بازه زمانی
    if start_time_frame and end_time_frame:
        if start_time_frame >= end_time_frame:
            raise ValueError("تاریخ پایان باید بعد از تاریخ شروع باشد")
    
    # Validation: برای sender باید بازه زمانی داشته باشد
    if is_sender and not (start_time_frame and end_time_frame):
        raise ValueError("برای کارت فرستنده باید بازه زمانی مشخص شود")
    
    # Validation: برای traveler باید تاریخ دقیق داشته باشد
    if not is_sender and not ticket_date_time:
        raise ValueError("برای کارت مسافر باید تاریخ سفر مشخص شود")
    
    # ساخت کارت
    card_data = {
        "is_sender": is_sender,
        "origin_country_id": origin_country_id,
        "origin_city_id": origin_city_id,
        "destination_country_id": destination_country_id,
        "destination_city_id": destination_city_id,
        "start_time_frame": start_time_frame,
        "end_time_frame": end_time_frame,
        "ticket_date_time": ticket_date_time,
        "weight": weight,
        "is_packed": is_packed,
        "price_aed": price_aed,
        "description": description,
        "product_classification_id": product_classification_id
    }
    
    card = await card_repo.create(db, owner_id, **card_data)
    
    # اتصال به کامیونیتی‌ها (اگر مشخص شده)
    if community_ids:
        await card_repo.add_communities(db, card.id, community_ids)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="card_create",
        actor_user_id=owner_id,
        card_id=card.id,
        payload={
            "is_sender": is_sender,
            "origin_city_id": origin_city_id,
            "destination_city_id": destination_city_id
        }
    )
    
    await db.commit()
    
    logger.info(f"Card created: {card.id} by user {owner_id}")
    return card


async def update_card(
    db: AsyncSession,
    card_id: int,
    user_id: int,
    **updates
):
    """ویرایش کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        user_id: شناسه کاربر
        **updates: فیلدهایی که باید آپدیت شوند
        
    Returns:
        Card آپدیت‌شده
        
    Raises:
        ValueError: اگر کارت یافت نشود
        PermissionError: اگر کاربر صاحب کارت نباشد
    """
    # بررسی وجود کارت
    card = await card_repo.get_by_id(db, card_id)
    if not card:
        raise ValueError("کارت یافت نشد")
    
    # بررسی ownership
    if card.owner_id != user_id:
        raise PermissionError("شما مجاز به ویرایش این کارت نیستید")
    
    # Validation: بررسی بازه زمانی
    start = updates.get("start_time_frame", card.start_time_frame)
    end = updates.get("end_time_frame", card.end_time_frame)
    if start and end and start >= end:
        raise ValueError("تاریخ پایان باید بعد از تاریخ شروع باشد")
    
    # فیلدهای nullable که می‌توانند None باشند
    nullable_fields = {
        'weight', 'is_packed', 'price_aed', 'description', 
        'product_classification_id', 'start_time_frame', 
        'end_time_frame', 'ticket_date_time', 'community_ids'
    }
    
    # حذف فقط فیلدهایی که None هستند و nullable نیستند
    updates_clean = {}
    for k, v in updates.items():
        if v is None and k not in nullable_fields:
            continue
        updates_clean[k] = v
    
    if not updates_clean:
        return card
    
    # اعمال تغییرات
    updated_card = await card_repo.update_card(db, card_id, **updates_clean)
    
    # ثبت لاگ
    await log_service.log_event(
        db,
        event_type="card_update",
        actor_user_id=user_id,
        card_id=card_id,
        payload={"updated_fields": list(updates_clean.keys())}
    )
    
    await db.commit()
    
    logger.info(f"Card updated: {card_id} by user {user_id}")
    return updated_card or card


async def delete_card(
    db: AsyncSession,
    card_id: int,
    user_id: int
) -> bool:
    """حذف کارت.
    
    Args:
        db: Database session
        card_id: شناسه کارت
        user_id: شناسه کاربر
        
    Returns:
        True در صورت موفقیت
        
    Raises:
        ValueError: اگر کارت یافت نشود
        PermissionError: اگر کاربر صاحب کارت نباشد
    """
    # بررسی وجود کارت
    card = await card_repo.get_by_id(db, card_id)
    if not card:
        raise ValueError("کارت یافت نشد")
    
    # بررسی ownership
    if card.owner_id != user_id:
        raise PermissionError("شما مجاز به حذف این کارت نیستید")
    
    # ثبت لاگ قبل از حذف (به خاطر foreign key constraint)
    await log_service.log_event(
        db,
        event_type="card_delete",
        actor_user_id=user_id,
        card_id=card_id
    )
    
    # حذف (hard delete در MVP)
    success = await card_repo.delete_card(db, card_id)
    
    await db.commit()
    
    logger.info(f"Card deleted: {card_id} by user {user_id}")
    return success


async def get_user_cards(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int
):
    """دریافت کارت‌های یک کاربر.
    
    Args:
        db: Database session
        user_id: شناسه کاربر
        page: شماره صفحه
        page_size: تعداد آیتم در صفحه
        
    Returns:
        PaginatedResponse از کارت‌ها
    """
    cards, total = await card_repo.get_by_owner_id(db, user_id, page, page_size)
    
    return PaginatedResponse.create(
        items=cards,
        total=total,
        page=page,
        page_size=page_size
    )

