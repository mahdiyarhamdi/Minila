"""Message schemas برای پیام‌رسانی."""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut


class MessageCreate(BaseModel):
    """ایجاد Message جدید."""
    
    receiver_id: int = Field(..., description="شناسه گیرنده پیام")
    body: str = Field(..., min_length=1, max_length=5000, description="متن پیام")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "receiver_id": 2,
                "body": "سلام، من می‌توانم بسته شما را به دبی منتقل کنم."
            }
        }
    )


class MessageOut(BaseModel):
    """خروجی Message با اطلاعات sender و receiver."""
    
    id: int
    sender: UserBasicOut
    receiver: UserBasicOut
    body: str
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "sender": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "receiver": {"id": 2, "first_name": "محمد", "last_name": "رضایی"},
                "body": "سلام، من می‌توانم بسته شما را به دبی منتقل کنم.",
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )


class LastMessageInfo(BaseModel):
    """اطلاعات آخرین پیام در یک مکالمه."""
    
    body: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ConversationOut(BaseModel):
    """خروجی Conversation با اطلاعات کاربر مقابل و آخرین پیام."""
    
    user: UserBasicOut = Field(..., description="کاربر مقابل در مکالمه")
    last_message: LastMessageInfo = Field(..., description="آخرین پیام رد و بدل شده")
    unread_count: int = Field(default=0, description="تعداد پیام‌های خوانده نشده")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user": {"id": 2, "first_name": "محمد", "last_name": "رضایی", "email": "mohammad@example.com"},
                "last_message": {
                    "body": "متشکرم، منتظر بسته هستم.",
                    "created_at": "2024-01-01T14:30:00"
                },
                "unread_count": 2
            }
        }
    )

