"""Alert model for admin notifications and monitoring."""
from typing import Optional
from sqlalchemy import String, Text, Boolean, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from .base import BaseModel


class Alert(BaseModel):
    """مدل هشدار (Alert) برای اطلاع‌رسانی به ادمین‌ها."""
    
    __tablename__ = "alert"
    __table_args__ = (
        Index("ix_alert_type_created", "type", "created_at"),
        Index("ix_alert_priority_read", "priority", "is_read"),
        Index("ix_alert_created_at", "created_at"),
    )
    
    # نوع هشدار: error, security, report, user, card, membership
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # اولویت: high, normal
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    
    # عنوان و پیام
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # اطلاعات اضافی (JSON)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # وضعیت خوانده شدن
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # آیا ایمیل ارسال شده؟
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    def __repr__(self) -> str:
        return f"<Alert(id={self.id}, type={self.type}, priority={self.priority})>"

