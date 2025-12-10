"""Community schemas برای کامیونیتی‌ها."""
import re
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from .user import UserBasicOut, AvatarOut


class CommunityCreate(BaseModel):
    """ایجاد Community جدید."""
    
    name: str = Field(..., min_length=1, max_length=100, description="نام کامیونیتی")
    slug: str = Field(
        ..., 
        min_length=3, 
        max_length=50, 
        description="آیدی یکتا (فقط حروف انگلیسی کوچک، اعداد و آندرلاین)"
    )
    bio: Optional[str] = Field(None, max_length=500, description="توضیحات کامیونیتی")
    avatar_id: Optional[int] = Field(None, description="شناسه آواتار کامیونیتی")
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """بررسی فرمت معتبر slug."""
        v = v.lower().strip()
        pattern = r'^[a-z][a-z0-9_]{2,49}$'
        if not re.match(pattern, v):
            raise ValueError(
                'آیدی باید با حرف انگلیسی شروع شود و فقط شامل حروف کوچک، اعداد و آندرلاین باشد (حداقل 3 کاراکتر)'
            )
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "کامیونیتی مسافران تهران",
                "slug": "tehran_travelers",
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
    # slug قابل تغییر نیست پس در Update نیست
    
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
    slug: str
    bio: Optional[str] = None
    avatar: Optional[AvatarOut] = None
    owner: UserBasicOut
    member_count: int = Field(default=0, description="تعداد اعضای فعال")
    is_member: Optional[bool] = Field(default=None, description="آیا کاربر فعلی عضو است")
    my_role: Optional[str] = Field(default=None, description="نقش کاربر فعلی (owner, manager, moderator, member)")
    has_pending_request: Optional[bool] = Field(default=None, description="آیا درخواست عضویت در انتظار وجود دارد")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "کامیونیتی مسافران تهران",
                "slug": "tehran_travelers",
                "bio": "گروهی برای هماهنگی سفرهای بین‌شهری از تهران",
                "avatar": {"id": 1, "url": "https://example.com/avatar.jpg", "mime_type": "image/jpeg"},
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "member_count": 150,
                "is_member": True,
                "my_role": "member",
                "has_pending_request": False,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


class CommunityBasicOut(BaseModel):
    """خروجی خیلی ساده Community (برای نمایش در لیست‌ها)."""
    
    id: int
    name: str
    slug: str
    bio: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class CommunityDetailOut(BaseModel):
    """خروجی جزئیات کامل Community با آمار."""
    
    id: int
    name: str
    slug: str
    bio: Optional[str] = None
    avatar: Optional[AvatarOut] = None
    owner: UserBasicOut
    member_count: int = Field(..., description="تعداد اعضای فعال")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "کامیونیتی مسافران تهران",
                "slug": "tehran_travelers",
                "bio": "گروهی برای هماهنگی سفرهای بین‌شهری از تهران",
                "avatar": {"id": 1, "url": "https://example.com/avatar.jpg", "mime_type": "image/jpeg"},
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "member_count": 150,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


class SlugCheckResponse(BaseModel):
    """پاسخ چک کردن در دسترس بودن slug."""
    
    slug: str
    available: bool
    message: str

