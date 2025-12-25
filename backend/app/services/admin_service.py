"""Admin service for business logic."""
import json
import os
import subprocess
import gzip
from datetime import datetime
from pathlib import Path
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories import admin_repo
from ..schemas.admin import (
    DashboardStats,
    ChartData,
    ChartDataset,
    RecentActivity,
    GrowthMetrics,
    UserAdminOut,
    CommunityAdminOut,
    CardAdminOut,
    ReportAdminOut,
    RequestAdminOut,
    LogAdminOut,
    SystemSettings,
    SystemSettingsUpdate,
    BackupInfo,
    BackupList,
    BackupCreateResponse,
)
from ..core.config import get_settings
from ..utils.logger import logger


settings = get_settings()

# مسیر فایل تنظیمات قابل ویرایش
SETTINGS_OVERRIDE_FILE = Path(__file__).parent.parent.parent / "settings_override.json"


def _load_settings_override() -> dict:
    """بارگذاری تنظیمات override از فایل."""
    try:
        if SETTINGS_OVERRIDE_FILE.exists():
            with open(SETTINGS_OVERRIDE_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load settings override: {e}")
    return {}


def _save_settings_override(data: dict) -> None:
    """ذخیره تنظیمات override در فایل."""
    try:
        with open(SETTINGS_OVERRIDE_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save settings override: {e}")


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


async def get_growth_metrics(db: AsyncSession) -> GrowthMetrics:
    """گرفتن متریک‌های رشد و تحلیل."""
    logger.info("Getting growth metrics")
    metrics = await admin_repo.get_growth_metrics(db)
    return GrowthMetrics(**metrics)


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
    await log_service.log_event(
        db=db,
        event_type=action,
        actor_user_id=admin_user_id,
        target_user_id=user_id,
        payload={"reason": reason} if reason else None,
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
    await log_service.log_event(
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
        await log_service.log_event(
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
        await log_service.log_event(
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
        await log_service.log_event(
            db=db,
            event_type="report_resolve",
            actor_user_id=admin_user_id,
            payload={"action": action, "note": note},
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

def get_messages_per_day_limit() -> int:
    """دریافت محدودیت پیام روزانه (با در نظر گرفتن override)."""
    overrides = _load_settings_override()
    return overrides.get("messages_per_day_limit", getattr(settings, "MESSAGES_PER_DAY", 50))


async def get_system_settings() -> SystemSettings:
    """گرفتن تنظیمات سیستم."""
    logger.info("Getting system settings")
    
    smtp_configured = bool(
        getattr(settings, "SMTP_HOST", None) and 
        getattr(settings, "SMTP_PORT", None)
    )
    
    redis_configured = bool(getattr(settings, "REDIS_URL", None))
    
    # بارگذاری تنظیمات override
    overrides = _load_settings_override()
    messages_per_day = overrides.get(
        "messages_per_day_limit", 
        getattr(settings, "MESSAGES_PER_DAY", 50)
    )
    
    return SystemSettings(
        smtp_configured=smtp_configured,
        smtp_host=getattr(settings, "SMTP_HOST", None) if smtp_configured else None,
        redis_configured=redis_configured,
        messages_per_day_limit=messages_per_day,
        app_version="1.0.0",
        environment=getattr(settings, "ENV", "development"),
    )


async def update_system_settings(
    data: SystemSettingsUpdate,
    admin_user_id: int,
) -> SystemSettings:
    """بروزرسانی تنظیمات سیستم."""
    logger.info(f"Admin {admin_user_id} updating system settings")
    
    # بارگذاری تنظیمات فعلی
    overrides = _load_settings_override()
    
    # بروزرسانی فقط فیلدهای ارسال شده
    if data.messages_per_day_limit is not None:
        overrides["messages_per_day_limit"] = data.messages_per_day_limit
    
    # ذخیره
    _save_settings_override(overrides)
    
    logger.info(f"Settings updated: {overrides}")
    
    # برگرداندن تنظیمات جدید
    return await get_system_settings()


# ==================== Backup Management ====================

# مسیر پوشه بکاپ‌ها
BACKUP_DIR = Path("/opt/minila/backups")


def list_backups() -> BackupList:
    """لیست کردن تمام فایل‌های بکاپ."""
    logger.info("Listing backups")
    
    backups = []
    total_size = 0.0
    
    if not BACKUP_DIR.exists():
        logger.warning(f"Backup directory does not exist: {BACKUP_DIR}")
        return BackupList(backups=[], total_size_mb=0.0)
    
    for file in BACKUP_DIR.glob("minila_backup_*.sql.gz"):
        try:
            stat = file.stat()
            size_mb = stat.st_size / (1024 * 1024)
            created_at = datetime.fromtimestamp(stat.st_mtime)
            
            backups.append(BackupInfo(
                filename=file.name,
                size_mb=round(size_mb, 2),
                created_at=created_at
            ))
            total_size += size_mb
        except Exception as e:
            logger.error(f"Error reading backup file {file}: {e}")
    
    # مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    backups.sort(key=lambda x: x.created_at, reverse=True)
    
    logger.info(f"Found {len(backups)} backups, total size: {total_size:.2f} MB")
    return BackupList(backups=backups, total_size_mb=round(total_size, 2))


def get_backup_path(filename: str) -> Optional[Path]:
    """گرفتن مسیر فایل بکاپ."""
    if not filename.startswith("minila_backup_") or not filename.endswith(".sql.gz"):
        return None
    
    file_path = BACKUP_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        return None
    
    return file_path


def delete_backup(filename: str) -> bool:
    """حذف یک فایل بکاپ."""
    logger.info(f"Deleting backup: {filename}")
    
    file_path = get_backup_path(filename)
    if not file_path:
        logger.warning(f"Backup file not found: {filename}")
        return False
    
    try:
        file_path.unlink()
        logger.info(f"Backup deleted: {filename}")
        return True
    except Exception as e:
        logger.error(f"Error deleting backup {filename}: {e}")
        return False


async def create_backup(admin_user_id: int) -> BackupCreateResponse:
    """ایجاد بکاپ دستی از دیتابیس."""
    logger.info(f"Admin {admin_user_id} creating manual backup")
    
    try:
        # ایجاد پوشه بکاپ اگر وجود نداشت
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"minila_backup_{timestamp}.sql.gz"
        backup_path = BACKUP_DIR / filename
        
        # اجرای pg_dump از طریق docker
        db_name = getattr(settings, "POSTGRES_DB", "minila")
        db_user = getattr(settings, "POSTGRES_USER", "minila")
        
        # استفاده از pg_dump داخل کانتینر
        cmd = f"docker exec minila_db pg_dump -U {db_user} {db_name}"
        
        logger.info(f"Running backup command: {cmd}")
        
        # اجرای دستور و gzip کردن خروجی
        process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"Backup failed: {error_msg}")
            return BackupCreateResponse(
                success=False,
                filename=None,
                message=f"خطا در ایجاد بکاپ: {error_msg}"
            )
        
        # فشرده‌سازی و ذخیره
        with gzip.open(backup_path, "wb") as f:
            f.write(stdout)
        
        size_mb = backup_path.stat().st_size / (1024 * 1024)
        logger.info(f"Backup created: {filename} ({size_mb:.2f} MB)")
        
        return BackupCreateResponse(
            success=True,
            filename=filename,
            message=f"بکاپ با موفقیت ایجاد شد ({size_mb:.2f} MB)"
        )
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return BackupCreateResponse(
            success=False,
            filename=None,
            message=f"خطا در ایجاد بکاپ: {str(e)}"
        )




