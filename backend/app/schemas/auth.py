"""Authentication schemas برای ورود و احراز هویت."""
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class AuthRequestOTPIn(BaseModel):
    """درخواست OTP برای ورود."""
    
    email: EmailStr = Field(..., description="آدرس ایمیل کاربر")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com"
            }
        }
    )


class AuthVerifyOTPIn(BaseModel):
    """تایید OTP و دریافت توکن."""
    
    email: EmailStr = Field(..., description="آدرس ایمیل کاربر")
    otp_code: str = Field(..., min_length=6, max_length=6, description="کد OTP ارسال شده به ایمیل")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "otp_code": "123456"
            }
        }
    )


class AuthTokenOut(BaseModel):
    """پاسخ حاوی توکن‌های JWT."""
    
    access_token: str = Field(..., description="توکن دسترسی (Access Token)")
    refresh_token: str = Field(..., description="توکن تازه‌سازی (Refresh Token)")
    token_type: str = Field(default="bearer", description="نوع توکن")
    expires_in: int = Field(..., description="مدت اعتبار access token (ثانیه)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 86400
            }
        }
    )


class AuthRefreshIn(BaseModel):
    """درخواست تازه‌سازی توکن."""
    
    refresh_token: str = Field(..., description="توکن تازه‌سازی")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    )


class AuthSignupIn(BaseModel):
    """ثبت‌نام کاربر جدید."""
    
    email: EmailStr = Field(..., description="آدرس ایمیل")
    password: str = Field(..., min_length=8, max_length=100, description="رمز عبور (حداقل 8 کاراکتر)")
    first_name: str = Field(..., min_length=1, max_length=100, description="نام")
    last_name: str = Field(..., min_length=1, max_length=100, description="نام خانوادگی")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "first_name": "علی",
                "last_name": "احمدی"
            }
        }
    )

