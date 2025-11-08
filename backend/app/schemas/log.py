"""Log schemas برای رویدادهای سیستمی."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut


class LogOut(BaseModel):
    """خروجی Log برای مشاهده رویدادهای سیستمی."""
    
    id: int
    event_type: str = Field(..., description="نوع رویداد")
    actor: Optional[UserBasicOut] = Field(None, description="کاربری که اقدام را انجام داده")
    target_user: Optional[UserBasicOut] = Field(None, description="کاربر هدف")
    card_id: Optional[int] = None
    community_id: Optional[int] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    payload: Optional[str] = Field(None, description="داده‌های اضافی به صورت JSON")
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "event_type": "login",
                "actor": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "target_user": None,
                "card_id": None,
                "community_id": None,
                "ip": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "payload": '{"success": true}',
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )


class LogEventType:
    """انواع رویدادهای قابل ثبت در سیستم."""
    
    SIGNUP = "signup"
    LOGIN = "login"
    EMAIL_VERIFY = "email_verify"
    JOIN_REQUEST = "join_request"
    JOIN_APPROVE = "join_approve"
    JOIN_REJECT = "join_reject"
    CARD_CREATE = "card_create"
    CARD_UPDATE = "card_update"
    CARD_DELETE = "card_delete"
    MESSAGE_SEND = "message_send"
    MESSAGE_BLOCKED = "message_blocked"
    BAN = "ban"
    UNBAN = "unban"
    REPORT_CREATE = "report_create"

