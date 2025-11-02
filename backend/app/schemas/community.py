"""Community schemas برای کامیونیتی‌ها."""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut, AvatarOut


class CommunityCreate(BaseModel):
    """ایجاد Community جدید."""
    
    name: str = Field(..., min_length=1, max_length=100, description="نام کامیونیتی")
    bio: Optional[str] = Field(None, max_length=500, description="توضیحات کامیونیتی")
    avatar_id: Optional[int] = Field(None, description="شناسه آواتار کامیونیتی")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "کامیونیتی مسافران تهران",
                "bio": "گروهی برای هماهنگی سفرهای بین‌شهری از تهران",
                "avatar_id": 1
            }
        }
    )


class CommunityUpdate(BaseModel):
    """ویرایش Community (همه فیلدها اختیاری)."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_id: Optional[int] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "کامیونیتی مسافران تهران",
                "bio": "توضیحات جدید"
            }
        }
    )


class CommunityOut(BaseModel):
    """خروجی Community با اطلاعات owner."""
    
    id: int
    name: str
    bio: Optional[str] = None
    avatar: Optional[AvatarOut] = None
    owner: UserBasicOut
    created_at: str
    updated_at: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "کامیونیتی مسافران تهران",
                "bio": "گروهی برای هماهنگی سفرهای بین‌شهری از تهران",
                "avatar": {"id": 1, "url": "https://example.com/avatar.jpg", "mime_type": "image/jpeg"},
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


class CommunityBasicOut(BaseModel):
    """خروجی خیلی ساده Community (برای نمایش در لیست‌ها)."""
    
    id: int
    name: str
    bio: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class CommunityDetailOut(BaseModel):
    """خروجی جزئیات کامل Community با آمار."""
    
    id: int
    name: str
    bio: Optional[str] = None
    avatar: Optional[AvatarOut] = None
    owner: UserBasicOut
    member_count: int = Field(..., description="تعداد اعضای فعال")
    created_at: str
    updated_at: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "کامیونیتی مسافران تهران",
                "bio": "گروهی برای هماهنگی سفرهای بین‌شهری از تهران",
                "avatar": {"id": 1, "url": "https://example.com/avatar.jpg", "mime_type": "image/jpeg"},
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "member_count": 150,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )

