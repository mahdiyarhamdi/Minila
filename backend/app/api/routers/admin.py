"""Admin panel API router."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse

from ..deps import DBSession, AdminUser
from ...services import admin_service
from ...services import alert_service
from ...schemas.admin import (
    DashboardStats,
    ChartData,
    RecentActivity,
    GrowthMetrics,
    UserBanIn,
    UserAdminToggleIn,
    ReportResolveIn,
    SystemSettings,
    SystemSettingsUpdate,
    PaginatedUserAdmin,
    PaginatedCommunityAdmin,
    PaginatedCardAdmin,
    PaginatedReportAdmin,
    PaginatedRequestAdmin,
    PaginatedLogAdmin,
    BackupList,
    BackupCreateResponse,
    BackupRestoreResponse,
    BackupUploadResponse,
)
from ...schemas.common import MessageResponse
from ...schemas.alert import AlertList, AlertStats, AlertOut


router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ==================== Dashboard ====================

@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="آمار کلی داشبورد",
    description="گرفتن آمار کلی برای نمایش در داشبورد ادمین"
)
async def get_dashboard_stats(
    db: DBSession,
    admin: AdminUser,
) -> DashboardStats:
    """دریافت آمار کلی داشبورد."""
    return await admin_service.get_dashboard_stats(db)


@router.get(
    "/stats/users-chart",
    response_model=ChartData,
    summary="نمودار ثبت‌نام کاربران",
    description="داده‌های نمودار ثبت‌نام کاربران جدید"
)
async def get_users_chart(
    db: DBSession,
    admin: AdminUser,
    days: int = Query(30, ge=7, le=90, description="تعداد روز"),
) -> ChartData:
    """دریافت داده‌های نمودار کاربران."""
    return await admin_service.get_users_chart(db, days)


@router.get(
    "/stats/cards-chart",
    response_model=ChartData,
    summary="نمودار کارت‌های جدید",
    description="داده‌های نمودار کارت‌های ایجاد شده"
)
async def get_cards_chart(
    db: DBSession,
    admin: AdminUser,
    days: int = Query(30, ge=7, le=90, description="تعداد روز"),
) -> ChartData:
    """دریافت داده‌های نمودار کارت‌ها."""
    return await admin_service.get_cards_chart(db, days)


@router.get(
    "/stats/recent-activities",
    response_model=list[RecentActivity],
    summary="رویدادهای اخیر",
    description="لیست آخرین رویدادهای سیستم"
)
async def get_recent_activities(
    db: DBSession,
    admin: AdminUser,
    limit: int = Query(10, ge=5, le=50, description="تعداد رویدادها"),
) -> list[RecentActivity]:
    """دریافت رویدادهای اخیر."""
    return await admin_service.get_recent_activities(db, limit)


@router.get(
    "/stats/growth-metrics",
    response_model=GrowthMetrics,
    summary="متریک‌های رشد",
    description="متریک‌های تحلیلی شامل نرخ رشد، نرخ تبدیل و مقایسه دوره‌ای"
)
async def get_growth_metrics(
    db: DBSession,
    admin: AdminUser,
) -> GrowthMetrics:
    """دریافت متریک‌های رشد و تحلیل."""
    return await admin_service.get_growth_metrics(db)


# ==================== Users Management ====================

@router.get(
    "/users",
    response_model=PaginatedUserAdmin,
    summary="لیست کاربران",
    description="لیست کاربران با فیلتر و صفحه‌بندی"
)
async def get_users(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
    search: Optional[str] = Query(None, description="جستجو در ایمیل و نام"),
    is_active: Optional[bool] = Query(None, description="وضعیت فعال"),
    is_admin: Optional[bool] = Query(None, description="فقط ادمین‌ها"),
    email_verified: Optional[bool] = Query(None, description="فقط تایید شده‌ها"),
) -> PaginatedUserAdmin:
    """دریافت لیست کاربران."""
    users, total = await admin_service.get_users(
        db, page, page_size, search, is_active, is_admin, email_verified
    )
    return PaginatedUserAdmin(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/users/{user_id}",
    response_model=PaginatedUserAdmin,
    summary="جزئیات کاربر",
    description="اطلاعات کامل یک کاربر"
)
async def get_user_detail(
    user_id: int,
    db: DBSession,
    admin: AdminUser,
):
    """دریافت جزئیات کاربر."""
    user = await admin_service.get_user_detail(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    return user


@router.put(
    "/users/{user_id}/ban",
    response_model=MessageResponse,
    summary="بن/آن‌بن کاربر",
    description="تغییر وضعیت فعال بودن کاربر"
)
async def ban_user(
    user_id: int,
    data: UserBanIn,
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """بن یا آن‌بن کاربر."""
    # جلوگیری از بن کردن خود ادمین
    if user_id == admin["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نمی‌توانید خودتان را بن کنید"
        )
    
    result = await admin_service.ban_user(
        db, user_id, data.is_active, admin["user_id"], data.reason
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    action = "فعال" if data.is_active else "غیرفعال"
    return MessageResponse(message=f"کاربر با موفقیت {action} شد")


@router.put(
    "/users/{user_id}/admin",
    response_model=MessageResponse,
    summary="تغییر وضعیت ادمین",
    description="اعطا یا لغو دسترسی ادمین"
)
async def toggle_admin(
    user_id: int,
    data: UserAdminToggleIn,
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """تغییر وضعیت ادمین کاربر."""
    # جلوگیری از لغو ادمین خود
    if user_id == admin["user_id"] and not data.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نمی‌توانید دسترسی ادمین خودتان را لغو کنید"
        )
    
    result = await admin_service.toggle_admin(
        db, user_id, data.is_admin, admin["user_id"]
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    action = "اعطا" if data.is_admin else "لغو"
    return MessageResponse(message=f"دسترسی ادمین با موفقیت {action} شد")


# ==================== Communities Management ====================

@router.get(
    "/communities",
    response_model=PaginatedCommunityAdmin,
    summary="لیست کامیونیتی‌ها",
    description="لیست کامیونیتی‌ها با صفحه‌بندی"
)
async def get_communities(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
    search: Optional[str] = Query(None, description="جستجو در نام و slug"),
) -> PaginatedCommunityAdmin:
    """دریافت لیست کامیونیتی‌ها."""
    communities, total = await admin_service.get_communities(
        db, page, page_size, search
    )
    return PaginatedCommunityAdmin(
        items=communities,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.delete(
    "/communities/{community_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="حذف کامیونیتی",
    description="حذف یک کامیونیتی"
)
async def delete_community(
    community_id: int,
    db: DBSession,
    admin: AdminUser,
):
    """حذف کامیونیتی."""
    result = await admin_service.delete_community(db, community_id, admin["user_id"])
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کامیونیتی یافت نشد"
        )


# ==================== Cards Management ====================

@router.get(
    "/cards",
    response_model=PaginatedCardAdmin,
    summary="لیست کارت‌ها",
    description="لیست کارت‌ها با فیلتر و صفحه‌بندی"
)
async def get_cards(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
    search: Optional[str] = Query(None, description="جستجو در توضیحات"),
    is_sender: Optional[bool] = Query(None, description="نوع کارت"),
    owner_id: Optional[int] = Query(None, description="مالک کارت"),
) -> PaginatedCardAdmin:
    """دریافت لیست کارت‌ها."""
    cards, total = await admin_service.get_cards(
        db, page, page_size, search, is_sender, owner_id
    )
    return PaginatedCardAdmin(
        items=cards,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.delete(
    "/cards/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="حذف کارت",
    description="حذف یک کارت"
)
async def delete_card(
    card_id: int,
    db: DBSession,
    admin: AdminUser,
):
    """حذف کارت."""
    result = await admin_service.delete_card(db, card_id, admin["user_id"])
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کارت یافت نشد"
        )


# ==================== Reports Management ====================

@router.get(
    "/reports",
    response_model=PaginatedReportAdmin,
    summary="لیست گزارش‌ها",
    description="لیست گزارش‌های کاربران"
)
async def get_reports(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
) -> PaginatedReportAdmin:
    """دریافت لیست گزارش‌ها."""
    reports, total = await admin_service.get_reports(db, page, page_size)
    return PaginatedReportAdmin(
        items=reports,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/reports/{report_id}/resolve",
    response_model=MessageResponse,
    summary="بستن گزارش",
    description="بررسی و بستن گزارش"
)
async def resolve_report(
    report_id: int,
    data: ReportResolveIn,
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """بستن گزارش."""
    result = await admin_service.resolve_report(
        db, report_id, admin["user_id"], data.action, data.note
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش یافت نشد"
        )
    
    return MessageResponse(message="گزارش با موفقیت بررسی شد")


# ==================== Requests Management ====================

@router.get(
    "/requests",
    response_model=PaginatedRequestAdmin,
    summary="لیست درخواست‌های عضویت",
    description="لیست درخواست‌های عضویت در کامیونیتی‌ها"
)
async def get_requests(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
    status_filter: Optional[str] = Query(
        None, 
        alias="status",
        description="وضعیت: pending, approved, rejected"
    ),
    community_id: Optional[int] = Query(None, description="کامیونیتی خاص"),
) -> PaginatedRequestAdmin:
    """دریافت لیست درخواست‌های عضویت."""
    requests, total = await admin_service.get_requests(
        db, page, page_size, status_filter, community_id
    )
    return PaginatedRequestAdmin(
        items=requests,
        total=total,
        page=page,
        page_size=page_size,
    )


# ==================== Logs Management ====================

@router.get(
    "/logs",
    response_model=PaginatedLogAdmin,
    summary="لیست لاگ‌ها",
    description="لیست لاگ‌های سیستم با فیلتر"
)
async def get_logs(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="اندازه صفحه"),
    event_type: Optional[str] = Query(None, description="نوع رویداد"),
    actor_user_id: Optional[int] = Query(None, description="کاربر انجام‌دهنده"),
    date_from: Optional[datetime] = Query(None, description="از تاریخ"),
    date_to: Optional[datetime] = Query(None, description="تا تاریخ"),
) -> PaginatedLogAdmin:
    """دریافت لیست لاگ‌ها."""
    logs, total = await admin_service.get_logs(
        db, page, page_size, event_type, actor_user_id, date_from, date_to
    )
    return PaginatedLogAdmin(
        items=logs,
        total=total,
        page=page,
        page_size=page_size,
    )


# ==================== Settings ====================

@router.get(
    "/settings",
    response_model=SystemSettings,
    summary="تنظیمات سیستم",
    description="مشاهده تنظیمات سیستم"
)
async def get_settings(
    admin: AdminUser,
) -> SystemSettings:
    """دریافت تنظیمات سیستم."""
    return await admin_service.get_system_settings()


@router.put(
    "/settings",
    response_model=SystemSettings,
    summary="بروزرسانی تنظیمات سیستم",
    description="بروزرسانی تنظیمات قابل ویرایش سیستم"
)
async def update_settings(
    data: SystemSettingsUpdate,
    admin: AdminUser,
) -> SystemSettings:
    """بروزرسانی تنظیمات سیستم."""
    return await admin_service.update_system_settings(data, admin["user_id"])


# ==================== Backup Management ====================

@router.get(
    "/backups",
    response_model=BackupList,
    summary="لیست بکاپ‌ها",
    description="لیست تمام فایل‌های بکاپ موجود"
)
async def get_backups(
    admin: AdminUser,
) -> BackupList:
    """دریافت لیست بکاپ‌ها."""
    return admin_service.list_backups()


@router.get(
    "/backups/{filename}/download",
    summary="دانلود بکاپ",
    description="دانلود یک فایل بکاپ"
)
async def download_backup(
    filename: str,
    admin: AdminUser,
):
    """دانلود فایل بکاپ."""
    file_path = admin_service.get_backup_path(filename)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="فایل بکاپ یافت نشد"
        )
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/gzip"
    )


@router.delete(
    "/backups/{filename}",
    response_model=MessageResponse,
    summary="حذف بکاپ",
    description="حذف یک فایل بکاپ"
)
async def delete_backup(
    filename: str,
    admin: AdminUser,
) -> MessageResponse:
    """حذف فایل بکاپ."""
    result = admin_service.delete_backup(filename)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="فایل بکاپ یافت نشد"
        )
    
    return MessageResponse(message="بکاپ با موفقیت حذف شد")


@router.post(
    "/backups/create",
    response_model=BackupCreateResponse,
    summary="ایجاد بکاپ",
    description="ایجاد بکاپ دستی از دیتابیس"
)
async def create_backup(
    admin: AdminUser,
) -> BackupCreateResponse:
    """ایجاد بکاپ جدید."""
    return await admin_service.create_backup(admin["user_id"])


@router.post(
    "/backups/upload",
    response_model=BackupUploadResponse,
    summary="آپلود بکاپ",
    description="آپلود فایل بکاپ برای بازگردانی آینده"
)
async def upload_backup(
    admin: AdminUser,
    file: UploadFile = File(..., description="فایل بکاپ (.sql.gz یا .sql)")
) -> BackupUploadResponse:
    """آپلود فایل بکاپ."""
    # بررسی حجم فایل (حداکثر 500MB)
    content = await file.read()
    max_size = 500 * 1024 * 1024  # 500MB
    
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم فایل نباید بیشتر از 500 مگابایت باشد"
        )
    
    return await admin_service.upload_backup(
        file_content=content,
        original_filename=file.filename or "backup.sql.gz",
        admin_user_id=admin["user_id"]
    )


@router.post(
    "/backups/{filename}/restore",
    response_model=BackupRestoreResponse,
    summary="بازگردانی بکاپ",
    description="بازگردانی دیتابیس از فایل بکاپ. ⚠️ این عملیات داده‌های فعلی را جایگزین می‌کند!"
)
async def restore_backup(
    filename: str,
    admin: AdminUser,
) -> BackupRestoreResponse:
    """بازگردانی دیتابیس از بکاپ."""
    return await admin_service.restore_backup(filename, admin["user_id"])


# ==================== Alerts ====================

@router.get(
    "/alerts",
    response_model=AlertList,
    summary="لیست هشدارها",
    description="دریافت لیست هشدارها با فیلتر و pagination"
)
async def get_alerts(
    db: DBSession,
    admin: AdminUser,
    page: int = Query(1, ge=1, description="شماره صفحه"),
    page_size: int = Query(20, ge=10, le=100, description="تعداد در صفحه"),
    type: Optional[str] = Query(None, description="فیلتر نوع هشدار"),
    priority: Optional[str] = Query(None, description="فیلتر اولویت"),
    is_read: Optional[bool] = Query(None, description="فیلتر وضعیت خواندن"),
) -> AlertList:
    """دریافت لیست هشدارها."""
    return await alert_service.get_alerts(
        db=db,
        page=page,
        page_size=page_size,
        alert_type=type,
        priority=priority,
        is_read=is_read,
    )


@router.get(
    "/alerts/stats",
    response_model=AlertStats,
    summary="آمار هشدارها",
    description="دریافت آمار کلی هشدارها"
)
async def get_alert_stats(
    db: DBSession,
    admin: AdminUser,
) -> AlertStats:
    """دریافت آمار هشدارها."""
    return await alert_service.get_alert_stats(db)


@router.get(
    "/alerts/unread-count",
    summary="تعداد خوانده نشده",
    description="دریافت تعداد هشدارهای خوانده نشده"
)
async def get_unread_alerts_count(
    db: DBSession,
    admin: AdminUser,
) -> dict:
    """دریافت تعداد هشدارهای خوانده نشده."""
    count = await alert_service.get_unread_count(db)
    return {"unread_count": count}


@router.put(
    "/alerts/{alert_id}/read",
    response_model=MessageResponse,
    summary="علامت خوانده شده",
    description="علامت‌گذاری یک هشدار به عنوان خوانده شده"
)
async def mark_alert_as_read(
    alert_id: int,
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """علامت‌گذاری هشدار به عنوان خوانده شده."""
    success = await alert_service.mark_as_read(db, alert_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="هشدار یافت نشد"
        )
    return MessageResponse(message="هشدار به عنوان خوانده شده علامت‌گذاری شد")


@router.put(
    "/alerts/read-all",
    response_model=MessageResponse,
    summary="علامت همه خوانده شده",
    description="علامت‌گذاری تمام هشدارها به عنوان خوانده شده"
)
async def mark_all_alerts_as_read(
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """علامت‌گذاری تمام هشدارها به عنوان خوانده شده."""
    count = await alert_service.mark_all_as_read(db)
    return MessageResponse(message=f"{count} هشدار به عنوان خوانده شده علامت‌گذاری شد")


# ==================== Seed Test Data ====================

@router.post(
    "/seed-test-data",
    response_model=MessageResponse,
    summary="ایجاد داده‌های تستی",
    description="ایجاد کاربران، کامیونیتی‌ها و کارت‌های تستی برای دمو"
)
async def seed_test_data(
    db: DBSession,
    admin: AdminUser,
) -> MessageResponse:
    """ایجاد داده‌های تستی."""
    from ...utils.seed_test_data import seed_all_test_data
    
    result = await seed_all_test_data(db)
    
    return MessageResponse(
        message=f"داده‌های تستی ایجاد شد: {result['users_created']} کاربر، "
                f"{result['communities_created']} کامیونیتی، {result['cards_created']} کارت"
    )

