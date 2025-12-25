"""Alert schemas for admin notifications."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class AlertType(str, Enum):
    """انواع هشدار."""
    ERROR = "error"           # خطای سیستمی
    SECURITY = "security"     # رخداد امنیتی
    REPORT = "report"         # گزارش جدید کاربر
    USER = "user"             # رخداد کاربر (ثبت‌نام)
    CARD = "card"             # کارت جدید
    MEMBERSHIP = "membership" # درخواست عضویت


class AlertPriority(str, Enum):
    """اولویت هشدار."""
    HIGH = "high"
    NORMAL = "normal"


class AlertCreate(BaseModel):
    """ایجاد هشدار جدید."""
    type: AlertType
    priority: AlertPriority = AlertPriority.NORMAL
    title: str = Field(..., max_length=255)
    message: str
    extra_data: Optional[dict] = None


class AlertOut(BaseModel):
    """خروجی هشدار."""
    id: int
    type: str
    priority: str
    title: str
    message: str
    extra_data: Optional[dict] = None
    is_read: bool
    email_sent: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AlertList(BaseModel):
    """لیست هشدارها با pagination."""
    items: list[AlertOut]
    total: int
    page: int
    page_size: int
    unread_count: int


class AlertStats(BaseModel):
    """آمار هشدارها."""
    total: int
    unread: int
    high_priority_unread: int
    by_type: dict[str, int]

