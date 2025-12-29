"""Admin panel schemas for dashboard, stats, and management."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ==================== Dashboard Stats ====================

class DashboardStats(BaseModel):
    """آمار کلی داشبورد ادمین."""
    
    total_users: int = Field(..., description="تعداد کل کاربران")
    active_users: int = Field(..., description="کاربران فعال")
    banned_users: int = Field(..., description="کاربران مسدود شده")
    admin_users: int = Field(..., description="کاربران ادمین")
    verified_users: int = Field(..., description="کاربران تایید شده ایمیل")
    
    total_communities: int = Field(..., description="تعداد کل کامیونیتی‌ها")
    total_cards: int = Field(..., description="تعداد کل کارت‌ها")
    traveler_cards: int = Field(..., description="کارت‌های مسافر")
    sender_cards: int = Field(..., description="کارت‌های فرستنده")
    
    total_messages: int = Field(..., description="تعداد کل پیام‌ها")
    pending_requests: int = Field(..., description="درخواست‌های عضویت در انتظار")
    open_reports: int = Field(..., description="گزارش‌های بررسی نشده")
    
    new_users_today: int = Field(..., description="کاربران جدید امروز")
    new_users_week: int = Field(..., description="کاربران جدید هفته")
    new_users_month: int = Field(..., description="کاربران جدید ماه")
    
    new_cards_today: int = Field(..., description="کارت‌های جدید امروز")
    new_cards_week: int = Field(..., description="کارت‌های جدید هفته")
    new_cards_month: int = Field(..., description="کارت‌های جدید ماه")


class ChartDataset(BaseModel):
    """یک dataset برای نمودار."""
    
    label: str = Field(..., description="برچسب dataset")
    data: list[int] = Field(..., description="داده‌های dataset")
    color: Optional[str] = Field(None, description="رنگ dataset")


class ChartData(BaseModel):
    """داده‌های نمودار."""
    
    labels: list[str] = Field(..., description="برچسب‌های محور X")
    datasets: list[ChartDataset] = Field(..., description="dataset های نمودار")


class RecentActivity(BaseModel):
    """رویداد اخیر برای نمایش در داشبورد."""
    
    id: int
    event_type: str
    description: str
    actor_email: Optional[str] = None
    target_email: Optional[str] = None
    created_at: datetime


class GrowthMetrics(BaseModel):
    """متریک‌های رشد و تحلیل."""
    
    # نرخ‌های تبدیل
    email_verification_rate: float = Field(..., description="نرخ تایید ایمیل (درصد)")
    user_activity_rate: float = Field(..., description="نرخ فعالیت کاربران (درصد)")
    
    # نرخ رشد هفتگی
    users_growth_weekly: float = Field(..., description="رشد کاربران هفتگی (درصد)")
    cards_growth_weekly: float = Field(..., description="رشد کارت‌ها هفتگی (درصد)")
    
    # نرخ رشد ماهانه
    users_growth_monthly: float = Field(..., description="رشد کاربران ماهانه (درصد)")
    cards_growth_monthly: float = Field(..., description="رشد کارت‌ها ماهانه (درصد)")
    
    # میانگین‌های روزانه
    avg_daily_users: float = Field(..., description="میانگین ثبت‌نام روزانه")
    avg_daily_cards: float = Field(..., description="میانگین کارت روزانه")
    avg_daily_messages: float = Field(..., description="میانگین پیام روزانه")
    
    # داده‌های Sparkline (7 روز اخیر)
    users_sparkline: list[int] = Field(..., description="داده‌های کاربران 7 روز")
    cards_sparkline: list[int] = Field(..., description="داده‌های کارت‌ها 7 روز")
    messages_sparkline: list[int] = Field(..., description="داده‌های پیام‌ها 7 روز")
    
    # مقایسه این هفته با هفته قبل
    this_week_users: int = Field(..., description="کاربران این هفته")
    last_week_users: int = Field(..., description="کاربران هفته قبل")
    this_week_cards: int = Field(..., description="کارت‌های این هفته")
    last_week_cards: int = Field(..., description="کارت‌های هفته قبل")


# ==================== User Admin ====================

class UserAdminOut(BaseModel):
    """اطلاعات کاربر برای پنل ادمین."""
    
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # آمار
    cards_count: int = Field(0, description="تعداد کارت‌ها")
    communities_count: int = Field(0, description="تعداد کامیونیتی‌ها")
    messages_sent_count: int = Field(0, description="تعداد پیام‌های ارسالی")
    
    class Config:
        from_attributes = True


class UserAdminFilter(BaseModel):
    """فیلترهای لیست کاربران."""
    
    search: Optional[str] = Field(None, description="جستجو در ایمیل و نام")
    is_active: Optional[bool] = Field(None, description="وضعیت فعال")
    is_admin: Optional[bool] = Field(None, description="فقط ادمین‌ها")
    email_verified: Optional[bool] = Field(None, description="فقط تایید شده‌ها")


class UserBanIn(BaseModel):
    """ورودی برای بن/آن‌بن کاربر."""
    
    is_active: bool = Field(..., description="آیا کاربر فعال باشد")
    reason: Optional[str] = Field(None, description="دلیل تغییر وضعیت")


class UserAdminToggleIn(BaseModel):
    """ورودی برای تغییر وضعیت ادمین."""
    
    is_admin: bool = Field(..., description="آیا کاربر ادمین باشد")


# ==================== Community Admin ====================

class CommunityAdminOut(BaseModel):
    """اطلاعات کامیونیتی برای پنل ادمین."""
    
    id: int
    name: str
    slug: str
    bio: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # مالک
    owner_id: int
    owner_email: str
    owner_name: Optional[str] = None
    
    # آمار
    members_count: int = Field(0, description="تعداد اعضا")
    pending_requests_count: int = Field(0, description="درخواست‌های در انتظار")
    
    class Config:
        from_attributes = True


class CommunityAdminFilter(BaseModel):
    """فیلترهای لیست کامیونیتی‌ها."""
    
    search: Optional[str] = Field(None, description="جستجو در نام و slug")


# ==================== Card Admin ====================

class CardAdminOut(BaseModel):
    """اطلاعات کارت برای پنل ادمین."""
    
    id: int
    is_sender: bool
    description: Optional[str] = None
    weight: Optional[float] = None
    price_aed: Optional[float] = None
    currency: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # مالک
    owner_id: int
    owner_email: str
    owner_name: Optional[str] = None
    
    # مبدا و مقصد
    origin_city: str
    origin_country: str
    destination_city: str
    destination_country: str
    
    # تاریخ‌ها
    start_time_frame: Optional[datetime] = None
    end_time_frame: Optional[datetime] = None
    ticket_date_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CardAdminFilter(BaseModel):
    """فیلترهای لیست کارت‌ها."""
    
    search: Optional[str] = Field(None, description="جستجو در توضیحات")
    is_sender: Optional[bool] = Field(None, description="نوع کارت")
    owner_id: Optional[int] = Field(None, description="مالک کارت")


# ==================== Report Admin ====================

class ReportAdminOut(BaseModel):
    """اطلاعات گزارش برای پنل ادمین."""
    
    id: int
    body: str
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[int] = None
    created_at: datetime
    
    # گزارش‌دهنده
    reporter_id: Optional[int] = None
    reporter_email: Optional[str] = None
    reporter_name: Optional[str] = None
    
    # گزارش‌شده
    reported_id: Optional[int] = None
    reported_email: Optional[str] = None
    reported_name: Optional[str] = None
    
    # کارت مرتبط
    card_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class ReportResolveIn(BaseModel):
    """ورودی برای بستن گزارش."""
    
    action: str = Field(..., description="اقدام انجام شده: resolved, dismissed, ban_user")
    note: Optional[str] = Field(None, description="یادداشت ادمین")


# ==================== Request Admin ====================

class RequestAdminOut(BaseModel):
    """اطلاعات درخواست عضویت برای پنل ادمین."""
    
    id: int
    is_approved: Optional[bool] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # کاربر درخواست‌دهنده
    user_id: int
    user_email: str
    user_name: Optional[str] = None
    
    # کامیونیتی
    community_id: int
    community_name: str
    community_slug: str
    
    class Config:
        from_attributes = True


class RequestAdminFilter(BaseModel):
    """فیلترهای لیست درخواست‌ها."""
    
    status: Optional[str] = Field(None, description="وضعیت: pending, approved, rejected")
    community_id: Optional[int] = Field(None, description="کامیونیتی خاص")


# ==================== Log Admin ====================

class LogAdminOut(BaseModel):
    """اطلاعات لاگ برای پنل ادمین."""
    
    id: int
    event_type: str
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    payload: Optional[str] = None
    created_at: datetime
    
    # کاربر انجام‌دهنده
    actor_user_id: Optional[int] = None
    actor_email: Optional[str] = None
    
    # کاربر هدف
    target_user_id: Optional[int] = None
    target_email: Optional[str] = None
    
    # منابع مرتبط
    card_id: Optional[int] = None
    community_id: Optional[int] = None
    community_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class LogAdminFilter(BaseModel):
    """فیلترهای لیست لاگ‌ها."""
    
    event_type: Optional[str] = Field(None, description="نوع رویداد")
    actor_user_id: Optional[int] = Field(None, description="کاربر انجام‌دهنده")
    date_from: Optional[datetime] = Field(None, description="از تاریخ")
    date_to: Optional[datetime] = Field(None, description="تا تاریخ")


# ==================== Settings ====================

class SystemSettings(BaseModel):
    """تنظیمات سیستم."""
    
    smtp_configured: bool = Field(..., description="آیا SMTP تنظیم شده")
    smtp_host: Optional[str] = Field(None, description="آدرس SMTP")
    
    redis_configured: bool = Field(..., description="آیا Redis تنظیم شده")
    
    messages_per_day_limit: int = Field(..., description="محدودیت پیام روزانه")
    
    app_version: str = Field(..., description="نسخه اپلیکیشن")
    environment: str = Field(..., description="محیط اجرا")


class SystemSettingsUpdate(BaseModel):
    """ورودی برای بروزرسانی تنظیمات سیستم."""
    
    messages_per_day_limit: Optional[int] = Field(
        None, 
        ge=1, 
        le=1000, 
        description="محدودیت پیام روزانه (1-1000)"
    )


# ==================== Paginated Responses ====================

class PaginatedUserAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده کاربران."""
    
    items: list[UserAdminOut]
    total: int
    page: int
    page_size: int


class PaginatedCommunityAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده کامیونیتی‌ها."""
    
    items: list[CommunityAdminOut]
    total: int
    page: int
    page_size: int


class PaginatedCardAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده کارت‌ها."""
    
    items: list[CardAdminOut]
    total: int
    page: int
    page_size: int


class PaginatedReportAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده گزارش‌ها."""
    
    items: list[ReportAdminOut]
    total: int
    page: int
    page_size: int


class PaginatedRequestAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده درخواست‌ها."""
    
    items: list[RequestAdminOut]
    total: int
    page: int
    page_size: int


class PaginatedLogAdmin(BaseModel):
    """پاسخ صفحه‌بندی شده لاگ‌ها."""
    
    items: list[LogAdminOut]
    total: int
    page: int
    page_size: int


# ==================== Backup ====================

class BackupInfo(BaseModel):
    """اطلاعات یک فایل بکاپ."""
    
    filename: str = Field(..., description="نام فایل بکاپ")
    size_mb: float = Field(..., description="حجم فایل به مگابایت")
    created_at: datetime = Field(..., description="زمان ایجاد بکاپ")


class BackupList(BaseModel):
    """لیست بکاپ‌ها."""
    
    backups: list[BackupInfo] = Field(..., description="لیست بکاپ‌ها")
    total_size_mb: float = Field(..., description="حجم کل بکاپ‌ها")


class BackupCreateResponse(BaseModel):
    """پاسخ ایجاد بکاپ."""
    
    success: bool = Field(..., description="آیا بکاپ موفق بود")
    filename: Optional[str] = Field(None, description="نام فایل بکاپ")
    message: str = Field(..., description="پیام")


class BackupRestoreResponse(BaseModel):
    """پاسخ بازگردانی بکاپ."""
    
    success: bool = Field(..., description="آیا بازگردانی موفق بود")
    message: str = Field(..., description="پیام")
    tables_restored: Optional[int] = Field(None, description="تعداد جداول بازگردانده شده")


class BackupUploadResponse(BaseModel):
    """پاسخ آپلود بکاپ."""
    
    success: bool = Field(..., description="آیا آپلود موفق بود")
    filename: str = Field(..., description="نام فایل ذخیره شده")
    size_mb: float = Field(..., description="حجم فایل به مگابایت")
    message: str = Field(..., description="پیام")




