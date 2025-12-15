"""Admin service for business logic."""
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories import admin_repo
from ..schemas.admin import (
    DashboardStats,
    ChartData,
    ChartDataset,
    RecentActivity,
    UserAdminOut,
    CommunityAdminOut,
    CardAdminOut,
    ReportAdminOut,
    RequestAdminOut,
    LogAdminOut,
    SystemSettings,
)
from ..core.config import get_settings
from ..utils.logger import logger


settings = get_settings()


# ==================== Dashboard ====================

async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
    """گرفتن آمار کلی داشبورد."""
    logger.info("Getting dashboard stats")
    stats = await admin_repo.get_dashboard_stats(db)
    return DashboardStats(**stats)


async def get_users_chart(db: AsyncSession, days: int = 30) -> ChartData:
    """گرفتن داده‌های نمودار کاربران."""
    logger.info(f"Getting users chart data for {days} days")
    data = await admin_repo.get_users_chart_data(db, days)
    return ChartData(
        labels=data["labels"],
        datasets=[ChartDataset(**ds) for ds in data["datasets"]]
    )


async def get_cards_chart(db: AsyncSession, days: int = 30) -> ChartData:
    """گرفتن داده‌های نمودار کارت‌ها."""
    logger.info(f"Getting cards chart data for {days} days")
    data = await admin_repo.get_cards_chart_data(db, days)
    return ChartData(
        labels=data["labels"],
        datasets=[ChartDataset(**ds) for ds in data["datasets"]]
    )


async def get_recent_activities(db: AsyncSession, limit: int = 10) -> list[RecentActivity]:
    """گرفتن رویدادهای اخیر."""
    logger.info(f"Getting {limit} recent activities")
    activities = await admin_repo.get_recent_activities(db, limit)
    return [RecentActivity(**activity) for activity in activities]


# ==================== User Management ====================

async def get_users(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    email_verified: Optional[bool] = None,
) -> tuple[list[UserAdminOut], int]:
    """گرفتن لیست کاربران."""
    logger.info(f"Getting users page={page}, search={search}")
    users, total = await admin_repo.get_users_paginated(
        db, page, page_size, search, is_active, is_admin, email_verified
    )
    return [UserAdminOut(**user) for user in users], total


async def get_user_detail(db: AsyncSession, user_id: int) -> Optional[UserAdminOut]:
    """گرفتن جزئیات کاربر."""
    logger.info(f"Getting user detail for id={user_id}")
    users, _ = await admin_repo.get_users_paginated(db, page=1, page_size=1)
    # جستجوی کاربر خاص
    user = await admin_repo.get_user_by_id(db, user_id)
    if not user:
        return None
    
    # گرفتن آمار کاربر از لیست
    users_data, _ = await admin_repo.get_users_paginated(
        db, page=1, page_size=1, search=user.email
    )
    if users_data:
        return UserAdminOut(**users_data[0])
    return None


async def ban_user(
    db: AsyncSession,
    user_id: int,
    is_active: bool,
    admin_user_id: int,
    reason: Optional[str] = None,
) -> Optional[UserAdminOut]:
    """بن/آن‌بن کاربر."""
    action = "unban" if is_active else "ban"
    logger.info(f"Admin {admin_user_id} {action}ning user {user_id}, reason: {reason}")
    
    user = await admin_repo.update_user_active_status(db, user_id, is_active)
    if not user:
        return None
    
    # لاگ کردن
    from . import log_service
    await log_service.create_log(
        db=db,
        event_type=action,
        actor_user_id=admin_user_id,
        target_user_id=user_id,
        payload=reason,
    )
    
    return await get_user_detail(db, user_id)


async def toggle_admin(
    db: AsyncSession,
    user_id: int,
    is_admin: bool,
    admin_user_id: int,
) -> Optional[UserAdminOut]:
    """تغییر وضعیت ادمین کاربر."""
    action = "grant_admin" if is_admin else "revoke_admin"
    logger.info(f"Admin {admin_user_id} {action} for user {user_id}")
    
    user = await admin_repo.update_user_admin_status(db, user_id, is_admin)
    if not user:
        return None
    
    # لاگ کردن
    from . import log_service
    await log_service.create_log(
        db=db,
        event_type=action,
        actor_user_id=admin_user_id,
        target_user_id=user_id,
    )
    
    return await get_user_detail(db, user_id)


# ==================== Community Management ====================

async def get_communities(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> tuple[list[CommunityAdminOut], int]:
    """گرفتن لیست کامیونیتی‌ها."""
    logger.info(f"Getting communities page={page}, search={search}")
    communities, total = await admin_repo.get_communities_paginated(
        db, page, page_size, search
    )
    return [CommunityAdminOut(**c) for c in communities], total


async def delete_community(
    db: AsyncSession,
    community_id: int,
    admin_user_id: int,
) -> bool:
    """حذف کامیونیتی."""
    logger.info(f"Admin {admin_user_id} deleting community {community_id}")
    
    result = await admin_repo.delete_community(db, community_id)
    if result:
        # لاگ کردن
        from . import log_service
        await log_service.create_log(
            db=db,
            event_type="community_delete",
            actor_user_id=admin_user_id,
            community_id=community_id,
        )
    
    return result


# ==================== Card Management ====================

async def get_cards(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_sender: Optional[bool] = None,
    owner_id: Optional[int] = None,
) -> tuple[list[CardAdminOut], int]:
    """گرفتن لیست کارت‌ها."""
    logger.info(f"Getting cards page={page}, search={search}, is_sender={is_sender}")
    cards, total = await admin_repo.get_cards_paginated(
        db, page, page_size, search, is_sender, owner_id
    )
    return [CardAdminOut(**c) for c in cards], total


async def delete_card(
    db: AsyncSession,
    card_id: int,
    admin_user_id: int,
) -> bool:
    """حذف کارت."""
    logger.info(f"Admin {admin_user_id} deleting card {card_id}")
    
    result = await admin_repo.delete_card(db, card_id)
    if result:
        # لاگ کردن
        from . import log_service
        await log_service.create_log(
            db=db,
            event_type="card_delete",
            actor_user_id=admin_user_id,
            card_id=card_id,
        )
    
    return result


# ==================== Report Management ====================

async def get_reports(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[ReportAdminOut], int]:
    """گرفتن لیست گزارش‌ها."""
    logger.info(f"Getting reports page={page}")
    reports, total = await admin_repo.get_reports_paginated(db, page, page_size)
    return [ReportAdminOut(**r) for r in reports], total


async def resolve_report(
    db: AsyncSession,
    report_id: int,
    admin_user_id: int,
    action: str,
    note: Optional[str] = None,
) -> bool:
    """بستن گزارش."""
    logger.info(f"Admin {admin_user_id} resolving report {report_id} with action {action}")
    
    # اگر action = ban_user باشد، کاربر گزارش‌شده را بن می‌کنیم
    if action == "ban_user":
        reports, _ = await admin_repo.get_reports_paginated(db, page=1, page_size=1)
        # پیدا کردن گزارش
        for r in reports:
            if r["id"] == report_id and r["reported_id"]:
                await ban_user(db, r["reported_id"], False, admin_user_id, note)
                break
    
    # حذف گزارش (یا می‌توان فیلد is_resolved اضافه کرد)
    result = await admin_repo.delete_report(db, report_id)
    
    if result:
        # لاگ کردن
        from . import log_service
        await log_service.create_log(
            db=db,
            event_type="report_resolve",
            actor_user_id=admin_user_id,
            payload=f"action={action}, note={note}",
        )
    
    return result


# ==================== Request Management ====================

async def get_requests(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    community_id: Optional[int] = None,
) -> tuple[list[RequestAdminOut], int]:
    """گرفتن لیست درخواست‌های عضویت."""
    logger.info(f"Getting requests page={page}, status={status}")
    requests, total = await admin_repo.get_requests_paginated(
        db, page, page_size, status, community_id
    )
    return [RequestAdminOut(**r) for r in requests], total


# ==================== Log Management ====================

async def get_logs(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    event_type: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> tuple[list[LogAdminOut], int]:
    """گرفتن لیست لاگ‌ها."""
    logger.info(f"Getting logs page={page}, event_type={event_type}")
    logs, total = await admin_repo.get_logs_paginated(
        db, page, page_size, event_type, actor_user_id, date_from, date_to
    )
    return [LogAdminOut(**log) for log in logs], total


# ==================== Settings ====================

async def get_system_settings() -> SystemSettings:
    """گرفتن تنظیمات سیستم."""
    logger.info("Getting system settings")
    
    smtp_configured = bool(
        getattr(settings, "SMTP_HOST", None) and 
        getattr(settings, "SMTP_PORT", None)
    )
    
    redis_configured = bool(getattr(settings, "REDIS_URL", None))
    
    return SystemSettings(
        smtp_configured=smtp_configured,
        smtp_host=getattr(settings, "SMTP_HOST", None) if smtp_configured else None,
        redis_configured=redis_configured,
        messages_per_day_limit=getattr(settings, "MESSAGES_PER_DAY", 50),
        app_version="1.0.0",
        environment=getattr(settings, "ENV", "development"),
    )



