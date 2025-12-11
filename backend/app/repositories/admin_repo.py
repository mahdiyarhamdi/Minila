"""Admin repository for statistics and management queries."""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import func, select, and_, or_, desc, Integer, cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.user import User
from ..models.community import Community
from ..models.membership import Membership, Request
from ..models.card import Card
from ..models.message import Message
from ..models.report import Report
from ..models.log import Log


# ==================== Dashboard Stats ====================

async def get_dashboard_stats(db: AsyncSession) -> dict:
    """گرفتن آمار کلی داشبورد."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # آمار کاربران
    users_query = select(
        func.count(User.id).label('total'),
        func.sum(cast(User.is_active, Integer)).label('active'),
        func.sum(cast(~User.is_active, Integer)).label('banned'),
        func.sum(cast(User.is_admin, Integer)).label('admin'),
        func.sum(cast(User.email_verified, Integer)).label('verified'),
    ).select_from(User)
    
    users_result = await db.execute(users_query)
    users_stats = users_result.one()
    
    # آمار کامیونیتی‌ها
    communities_count = await db.scalar(select(func.count(Community.id)))
    
    # آمار کارت‌ها
    cards_query = select(
        func.count(Card.id).label('total'),
        func.sum(cast(~Card.is_sender, Integer)).label('traveler'),
        func.sum(cast(Card.is_sender, Integer)).label('sender'),
    ).select_from(Card)
    
    cards_result = await db.execute(cards_query)
    cards_stats = cards_result.one()
    
    # آمار پیام‌ها
    messages_count = await db.scalar(select(func.count(Message.id)))
    
    # درخواست‌های در انتظار
    pending_requests = await db.scalar(
        select(func.count(Request.id)).where(Request.is_approved.is_(None))
    )
    
    # گزارش‌های باز (فرض: گزارش‌هایی که هنوز resolved نشده‌اند)
    # چون فیلد is_resolved در مدل Report نیست، همه گزارش‌ها را می‌شماریم
    open_reports = await db.scalar(select(func.count(Report.id)))
    
    # کاربران جدید
    new_users_today = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )
    new_users_week = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= week_start)
    )
    new_users_month = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= month_start)
    )
    
    # کارت‌های جدید
    new_cards_today = await db.scalar(
        select(func.count(Card.id)).where(Card.created_at >= today_start)
    )
    new_cards_week = await db.scalar(
        select(func.count(Card.id)).where(Card.created_at >= week_start)
    )
    new_cards_month = await db.scalar(
        select(func.count(Card.id)).where(Card.created_at >= month_start)
    )
    
    return {
        "total_users": users_stats.total or 0,
        "active_users": users_stats.active or 0,
        "banned_users": users_stats.banned or 0,
        "admin_users": users_stats.admin or 0,
        "verified_users": users_stats.verified or 0,
        "total_communities": communities_count or 0,
        "total_cards": cards_stats.total or 0,
        "traveler_cards": cards_stats.traveler or 0,
        "sender_cards": cards_stats.sender or 0,
        "total_messages": messages_count or 0,
        "pending_requests": pending_requests or 0,
        "open_reports": open_reports or 0,
        "new_users_today": new_users_today or 0,
        "new_users_week": new_users_week or 0,
        "new_users_month": new_users_month or 0,
        "new_cards_today": new_cards_today or 0,
        "new_cards_week": new_cards_week or 0,
        "new_cards_month": new_cards_month or 0,
    }


async def get_users_chart_data(db: AsyncSession, days: int = 30) -> dict:
    """گرفتن داده‌های نمودار ثبت‌نام کاربران."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # گروه‌بندی بر اساس روز
    query = select(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).where(
        User.created_at >= start_date
    ).group_by(
        func.date(User.created_at)
    ).order_by(
        func.date(User.created_at)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # ساخت لیست کامل روزها
    labels = []
    data = []
    date_counts = {str(row.date): row.count for row in rows}
    
    for i in range(days):
        date = (start_date + timedelta(days=i)).date()
        labels.append(str(date))
        data.append(date_counts.get(str(date), 0))
    
    return {
        "labels": labels,
        "datasets": [{
            "label": "کاربران جدید",
            "data": data,
            "color": "#00A8E8"
        }]
    }


async def get_cards_chart_data(db: AsyncSession, days: int = 30) -> dict:
    """گرفتن داده‌های نمودار کارت‌های جدید."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # گروه‌بندی بر اساس روز و نوع
    query = select(
        func.date(Card.created_at).label('date'),
        Card.is_sender,
        func.count(Card.id).label('count')
    ).where(
        Card.created_at >= start_date
    ).group_by(
        func.date(Card.created_at),
        Card.is_sender
    ).order_by(
        func.date(Card.created_at)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # ساخت لیست کامل روزها
    labels = []
    traveler_data = []
    sender_data = []
    
    date_counts_traveler = {}
    date_counts_sender = {}
    
    for row in rows:
        key = str(row.date)
        if row.is_sender:
            date_counts_sender[key] = row.count
        else:
            date_counts_traveler[key] = row.count
    
    for i in range(days):
        date = (start_date + timedelta(days=i)).date()
        date_str = str(date)
        labels.append(date_str)
        traveler_data.append(date_counts_traveler.get(date_str, 0))
        sender_data.append(date_counts_sender.get(date_str, 0))
    
    return {
        "labels": labels,
        "datasets": [
            {
                "label": "مسافر",
                "data": traveler_data,
                "color": "#00A8E8"
            },
            {
                "label": "فرستنده",
                "data": sender_data,
                "color": "#E5C189"
            }
        ]
    }


async def get_recent_activities(db: AsyncSession, limit: int = 10) -> list:
    """گرفتن رویدادهای اخیر."""
    query = select(Log).options(
        selectinload(Log.actor),
        selectinload(Log.target_user),
        selectinload(Log.community)
    ).order_by(desc(Log.created_at)).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    activities = []
    for log in logs:
        description = _get_log_description(log)
        activities.append({
            "id": log.id,
            "event_type": log.event_type,
            "description": description,
            "actor_email": log.actor.email if log.actor else None,
            "target_email": log.target_user.email if log.target_user else None,
            "created_at": log.created_at,
        })
    
    return activities


def _get_log_description(log: Log) -> str:
    """تبدیل لاگ به توضیح خوانا."""
    event_descriptions = {
        "signup": "ثبت‌نام کاربر جدید",
        "login": "ورود کاربر",
        "email_verified": "تایید ایمیل",
        "join_request": "درخواست عضویت",
        "join_approved": "تایید عضویت",
        "join_rejected": "رد عضویت",
        "card_create": "ساخت کارت جدید",
        "message_send": "ارسال پیام",
        "ban": "مسدود کردن کاربر",
        "unban": "رفع مسدودیت کاربر",
    }
    return event_descriptions.get(log.event_type, log.event_type)


# ==================== User Management ====================

async def get_users_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    email_verified: Optional[bool] = None,
) -> tuple[list, int]:
    """گرفتن لیست کاربران با صفحه‌بندی و فیلتر."""
    # Base query
    query = select(User)
    count_query = select(func.count(User.id))
    
    # فیلترها
    filters = []
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
        )
        filters.append(search_filter)
    
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    if is_admin is not None:
        filters.append(User.is_admin == is_admin)
    
    if email_verified is not None:
        filters.append(User.email_verified == email_verified)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    # تعداد کل
    total = await db.scalar(count_query)
    
    # صفحه‌بندی
    offset = (page - 1) * page_size
    query = query.order_by(desc(User.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    # اضافه کردن آمار به هر کاربر
    users_with_stats = []
    for user in users:
        # تعداد کارت‌ها
        cards_count = await db.scalar(
            select(func.count(Card.id)).where(Card.owner_id == user.id)
        )
        # تعداد کامیونیتی‌ها
        communities_count = await db.scalar(
            select(func.count(Membership.id)).where(
                Membership.user_id == user.id,
                Membership.is_active == True
            )
        )
        # تعداد پیام‌های ارسالی
        messages_count = await db.scalar(
            select(func.count(Message.id)).where(Message.sender_id == user.id)
        )
        
        users_with_stats.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "email_verified": user.email_verified,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "cards_count": cards_count or 0,
            "communities_count": communities_count or 0,
            "messages_sent_count": messages_count or 0,
        })
    
    return users_with_stats, total or 0


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """گرفتن کاربر با ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user_active_status(
    db: AsyncSession,
    user_id: int,
    is_active: bool
) -> Optional[User]:
    """تغییر وضعیت فعال کاربر."""
    user = await get_user_by_id(db, user_id)
    if user:
        user.is_active = is_active
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
    return user


async def update_user_admin_status(
    db: AsyncSession,
    user_id: int,
    is_admin: bool
) -> Optional[User]:
    """تغییر وضعیت ادمین کاربر."""
    user = await get_user_by_id(db, user_id)
    if user:
        user.is_admin = is_admin
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
    return user


# ==================== Community Management ====================

async def get_communities_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> tuple[list, int]:
    """گرفتن لیست کامیونیتی‌ها با صفحه‌بندی."""
    query = select(Community).options(selectinload(Community.owner))
    count_query = select(func.count(Community.id))
    
    if search:
        search_filter = or_(
            Community.name.ilike(f"%{search}%"),
            Community.slug.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * page_size
    query = query.order_by(desc(Community.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    communities = result.scalars().all()
    
    communities_with_stats = []
    for community in communities:
        # تعداد اعضا
        members_count = await db.scalar(
            select(func.count(Membership.id)).where(
                Membership.community_id == community.id,
                Membership.is_active == True
            )
        )
        # درخواست‌های در انتظار
        pending_count = await db.scalar(
            select(func.count(Request.id)).where(
                Request.community_id == community.id,
                Request.is_approved.is_(None)
            )
        )
        
        communities_with_stats.append({
            "id": community.id,
            "name": community.name,
            "slug": community.slug,
            "bio": community.bio,
            "created_at": community.created_at,
            "updated_at": community.updated_at,
            "owner_id": community.owner_id,
            "owner_email": community.owner.email if community.owner else None,
            "owner_name": f"{community.owner.first_name or ''} {community.owner.last_name or ''}".strip() if community.owner else None,
            "members_count": members_count or 0,
            "pending_requests_count": pending_count or 0,
        })
    
    return communities_with_stats, total or 0


async def delete_community(db: AsyncSession, community_id: int) -> bool:
    """حذف کامیونیتی."""
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if community:
        await db.delete(community)
        await db.commit()
        return True
    return False


# ==================== Card Management ====================

async def get_cards_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_sender: Optional[bool] = None,
    owner_id: Optional[int] = None,
) -> tuple[list, int]:
    """گرفتن لیست کارت‌ها با صفحه‌بندی."""
    query = select(Card).options(
        selectinload(Card.owner),
        selectinload(Card.origin_city),
        selectinload(Card.origin_country),
        selectinload(Card.destination_city),
        selectinload(Card.destination_country),
    )
    count_query = select(func.count(Card.id))
    
    filters = []
    if search:
        filters.append(Card.description.ilike(f"%{search}%"))
    if is_sender is not None:
        filters.append(Card.is_sender == is_sender)
    if owner_id is not None:
        filters.append(Card.owner_id == owner_id)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * page_size
    query = query.order_by(desc(Card.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    cards = result.scalars().all()
    
    cards_data = []
    for card in cards:
        cards_data.append({
            "id": card.id,
            "is_sender": card.is_sender,
            "description": card.description,
            "weight": card.weight,
            "price_aed": card.price_aed,
            "currency": card.currency,
            "created_at": card.created_at,
            "updated_at": card.updated_at,
            "owner_id": card.owner_id,
            "owner_email": card.owner.email if card.owner else None,
            "owner_name": f"{card.owner.first_name or ''} {card.owner.last_name or ''}".strip() if card.owner else None,
            "origin_city": card.origin_city.name_en if card.origin_city else None,
            "origin_country": card.origin_country.name_en if card.origin_country else None,
            "destination_city": card.destination_city.name_en if card.destination_city else None,
            "destination_country": card.destination_country.name_en if card.destination_country else None,
            "start_time_frame": card.start_time_frame,
            "end_time_frame": card.end_time_frame,
            "ticket_date_time": card.ticket_date_time,
        })
    
    return cards_data, total or 0


async def delete_card(db: AsyncSession, card_id: int) -> bool:
    """حذف کارت."""
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if card:
        await db.delete(card)
        await db.commit()
        return True
    return False


# ==================== Report Management ====================

async def get_reports_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list, int]:
    """گرفتن لیست گزارش‌ها با صفحه‌بندی."""
    query = select(Report).options(
        selectinload(Report.reporter),
        selectinload(Report.reported),
    )
    count_query = select(func.count(Report.id))
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * page_size
    query = query.order_by(desc(Report.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    reports_data = []
    for report in reports:
        reports_data.append({
            "id": report.id,
            "body": report.body,
            "is_resolved": False,  # فیلد is_resolved در مدل نیست
            "resolved_at": None,
            "resolved_by_id": None,
            "created_at": report.created_at,
            "reporter_id": report.reporter_id,
            "reporter_email": report.reporter.email if report.reporter else None,
            "reporter_name": f"{report.reporter.first_name or ''} {report.reporter.last_name or ''}".strip() if report.reporter else None,
            "reported_id": report.reported_id,
            "reported_email": report.reported.email if report.reported else None,
            "reported_name": f"{report.reported.first_name or ''} {report.reported.last_name or ''}".strip() if report.reported else None,
            "card_id": report.card_id,
        })
    
    return reports_data, total or 0


async def delete_report(db: AsyncSession, report_id: int) -> bool:
    """حذف گزارش."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report:
        await db.delete(report)
        await db.commit()
        return True
    return False


# ==================== Request Management ====================

async def get_requests_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    community_id: Optional[int] = None,
) -> tuple[list, int]:
    """گرفتن لیست درخواست‌های عضویت با صفحه‌بندی."""
    query = select(Request).options(
        selectinload(Request.user),
        selectinload(Request.community),
    )
    count_query = select(func.count(Request.id))
    
    filters = []
    if status == "pending":
        filters.append(Request.is_approved.is_(None))
    elif status == "approved":
        filters.append(Request.is_approved == True)
    elif status == "rejected":
        filters.append(Request.is_approved == False)
    
    if community_id:
        filters.append(Request.community_id == community_id)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * page_size
    query = query.order_by(desc(Request.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    requests_data = []
    for request in requests:
        requests_data.append({
            "id": request.id,
            "is_approved": request.is_approved,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
            "user_id": request.user_id,
            "user_email": request.user.email if request.user else None,
            "user_name": f"{request.user.first_name or ''} {request.user.last_name or ''}".strip() if request.user else None,
            "community_id": request.community_id,
            "community_name": request.community.name if request.community else None,
            "community_slug": request.community.slug if request.community else None,
        })
    
    return requests_data, total or 0


# ==================== Log Management ====================

async def get_logs_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    event_type: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> tuple[list, int]:
    """گرفتن لیست لاگ‌ها با صفحه‌بندی."""
    query = select(Log).options(
        selectinload(Log.actor),
        selectinload(Log.target_user),
        selectinload(Log.community),
    )
    count_query = select(func.count(Log.id))
    
    filters = []
    if event_type:
        filters.append(Log.event_type == event_type)
    if actor_user_id:
        filters.append(Log.actor_user_id == actor_user_id)
    if date_from:
        filters.append(Log.created_at >= date_from)
    if date_to:
        filters.append(Log.created_at <= date_to)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * page_size
    query = query.order_by(desc(Log.created_at)).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    logs_data = []
    for log in logs:
        logs_data.append({
            "id": log.id,
            "event_type": log.event_type,
            "ip": log.ip,
            "user_agent": log.user_agent,
            "payload": log.payload,
            "created_at": log.created_at,
            "actor_user_id": log.actor_user_id,
            "actor_email": log.actor.email if log.actor else None,
            "target_user_id": log.target_user_id,
            "target_email": log.target_user.email if log.target_user else None,
            "card_id": log.card_id,
            "community_id": log.community_id,
            "community_name": log.community.name if log.community else None,
        })
    
    return logs_data, total or 0

