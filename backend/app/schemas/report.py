"""Report schemas برای گزارش محتوا."""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut


class ReportCreate(BaseModel):
    """ایجاد Report جدید."""
    
    reported_id: Optional[int] = Field(None, description="شناسه کاربر گزارش‌شده")
    card_id: Optional[int] = Field(None, description="شناسه کارت گزارش‌شده")
    body: str = Field(..., min_length=10, max_length=2000, description="متن گزارش (حداقل 10 کاراکتر)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reported_id": 2,
                "body": "این کاربر رفتار نامناسبی دارد و پیام‌های اسپم می‌فرستد."
            }
        }
    )


class ReportOut(BaseModel):
    """خروجی Report با اطلاعات reporter و reported."""
    
    id: int
    reporter: Optional[UserBasicOut] = None
    reported: Optional[UserBasicOut] = None
    card_id: Optional[int] = None
    body: str
    created_at: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "reporter": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "reported": {"id": 2, "first_name": "محمد", "last_name": "رضایی"},
                "card_id": None,
                "body": "این کاربر رفتار نامناسبی دارد و پیام‌های اسپم می‌فرستد.",
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )

