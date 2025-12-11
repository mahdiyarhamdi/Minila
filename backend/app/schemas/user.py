"""User schemas برای کاربران."""
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ========== Sub-schemas ==========

class AvatarOut(BaseModel):
    """خروجی Avatar."""
    
    id: int
    url: str
    mime_type: str
    
    model_config = ConfigDict(from_attributes=True)


# Import location schemas from location module
from .location import CountryOut, CityOut


# ========== User Schemas ==========

class UserBase(BaseModel):
    """فیلدهای پایه User."""
    
    email: EmailStr = Field(..., description="آدرس ایمیل")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="نام")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="نام خانوادگی")
    national_id: Optional[str] = Field(None, max_length=20, description="کد ملی")
    gender: Optional[str] = Field(None, max_length=10, description="جنسیت")
    birthday: Optional[date] = Field(None, description="تاریخ تولد")
    postal_code: Optional[str] = Field(None, max_length=20, description="کد پستی")


class UserCreate(UserBase):
    """ایجاد User جدید."""
    
    password: str = Field(..., min_length=8, max_length=100, description="رمز عبور (حداقل 8 کاراکتر)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "first_name": "علی",
                "last_name": "احمدی",
                "national_id": "1234567890",
                "gender": "male",
                "birthday": "1990-01-01",
                "postal_code": "1234567890"
            }
        }
    )


class UserUpdate(BaseModel):
    """ویرایش User (همه فیلدها اختیاری)."""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    national_id: Optional[str] = Field(None, max_length=20)
    gender: Optional[str] = Field(None, max_length=10)
    birthday: Optional[date] = None
    postal_code: Optional[str] = Field(None, max_length=20)
    avatar_id: Optional[int] = None
    country_id: Optional[int] = None
    city_id: Optional[int] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "first_name": "علی",
                "last_name": "احمدی",
                "avatar_id": 1,
                "city_id": 1
            }
        }
    )


class UserOut(BaseModel):
    """خروجی ساده User (بدون اطلاعات حساس)."""
    
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_verified: bool
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "email": "user@example.com",
                "first_name": "علی",
                "last_name": "احمدی",
                "is_active": True,
                "is_admin": False,
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )


class UserMeOut(BaseModel):
    """خروجی کامل User (برای پروفایل خود کاربر)."""
    
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    national_id: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    postal_code: Optional[str] = None
    email_verified: bool
    is_active: bool
    is_admin: bool
    avatar: Optional[AvatarOut] = None
    country: Optional[CountryOut] = None
    city: Optional[CityOut] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "email": "user@example.com",
                "first_name": "علی",
                "last_name": "احمدی",
                "national_id": "1234567890",
                "gender": "male",
                "birthday": "1990-01-01",
                "postal_code": "1234567890",
                "is_active": True,
                "is_admin": False,
                "avatar": {"id": 1, "url": "https://example.com/avatar.jpg", "mime_type": "image/jpeg"},
                "country": {"id": 1, "name": "ایران"},
                "city": {"id": 1, "name": "تهران", "country_id": 1},
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


class UserBasicOut(BaseModel):
    """خروجی خیلی ساده User (برای نمایش در لیست‌ها)."""
    
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

