"""Message schemas برای پیام‌رسانی."""
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
    created_at: str
    
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

