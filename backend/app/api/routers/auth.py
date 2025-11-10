"""Authentication endpoints."""
from typing import Annotated, Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ...api.deps import DBSession
from ...schemas.auth import (
    AuthSignupIn,
    AuthRequestOTPIn,
    AuthVerifyOTPIn,
    AuthVerifyEmailIn,
    AuthLoginPasswordIn,
    AuthTokenOut,
    AuthRefreshIn
)
from ...schemas.user import UserOut
from ...services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_client_info(request: Request) -> Tuple[Optional[str], Optional[str]]:
    """دریافت اطلاعات کلاینت (IP و User-Agent).
    
    Args:
        request: درخواست FastAPI
        
    Returns:
        tuple از (ip, user_agent)
    """
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    response_model=UserOut,
    summary="ثبت‌نام کاربر جدید",
    description="""
ثبت‌نام کاربر جدید با ایمیل و رمز عبور.

پس از ثبت‌نام موفق:
- رمز عبور به صورت هش شده ذخیره می‌شود
- email_verified=False تنظیم می‌شود
- کد OTP برای تایید ایمیل ارسال می‌شود (اعتبار 10 دقیقه)

کاربر باید ابتدا ایمیل خود را با endpoint /verify-email تایید کند.
    """
)
async def signup(
    data: AuthSignupIn,
    request: Request,
    db: DBSession
) -> UserOut:
    """ثبت‌نام کاربر جدید."""
    try:
        ip, user_agent = get_client_info(request)
        
        user = await auth_service.signup(
            db,
            email=data.email,
            password=data.password,
            first_name=data.first_name,
            last_name=data.last_name,
            ip=ip,
            user_agent=user_agent
        )
        
        return UserOut.model_validate(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/request-otp",
    status_code=status.HTTP_200_OK,
    summary="درخواست OTP برای ورود",
    description="""
درخواست کد OTP برای ورود به سیستم.

کد 6 رقمی به ایمیل کاربر ارسال می‌شود و تا 10 دقیقه اعتبار دارد.

**نکته امنیتی**: در این نسخه MVP، OTP به صورت خام ذخیره می‌شود.
در نسخه production باید hash شود.
    """
)
async def request_otp(
    data: AuthRequestOTPIn,
    request: Request,
    db: DBSession
) -> dict[str, str]:
    """درخواست OTP برای ورود."""
    try:
        ip, user_agent = get_client_info(request)
        
        await auth_service.request_otp(
            db,
            email=data.email,
            ip=ip,
            user_agent=user_agent
        )
        
        return {
            "message": "کد OTP به ایمیل شما ارسال شد",
            "email": data.email
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/verify-otp",
    status_code=status.HTTP_200_OK,
    response_model=AuthTokenOut,
    summary="تایید OTP و دریافت توکن",
    description="""
تایید کد OTP و دریافت JWT access token و refresh token.

پس از تایید موفق OTP:
- کد OTP از سیستم پاک می‌شود (single-use)
- JWT access token با اعتبار 24 ساعت صادر می‌شود
- JWT refresh token با اعتبار 7 روز صادر می‌شود
- رویداد ورود موفق ثبت می‌شود
    """
)
async def verify_otp(
    data: AuthVerifyOTPIn,
    request: Request,
    db: DBSession
) -> AuthTokenOut:
    """تایید OTP و دریافت JWT tokens."""
    try:
        ip, user_agent = get_client_info(request)
        
        user = await auth_service.verify_otp(
            db,
            email=data.email,
            otp_code=data.otp_code,
            ip=ip,
            user_agent=user_agent
        )
        
        # تولید tokens
        tokens = auth_service.create_tokens(user.id, user.email)
        
        return AuthTokenOut(**tokens)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    response_model=AuthTokenOut,
    summary="تایید ایمیل با OTP",
    description="""
تایید ایمیل کاربر با کد OTP ارسال شده.

پس از تایید موفق:
- email_verified=True تنظیم می‌شود
- کد OTP پاک می‌شود
- JWT tokens صادر می‌شود

پس از این مرحله کاربر می‌تواند وارد سیستم شود.
    """
)
async def verify_email(
    data: AuthVerifyEmailIn,
    request: Request,
    db: DBSession
) -> AuthTokenOut:
    """تایید ایمیل با OTP."""
    try:
        ip, user_agent = get_client_info(request)
        
        user = await auth_service.verify_email_otp(
            db,
            email=data.email,
            otp_code=data.otp_code,
            ip=ip,
            user_agent=user_agent
        )
        
        # تولید tokens
        tokens = auth_service.create_tokens(user.id, user.email)
        
        return AuthTokenOut(**tokens)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/login-password",
    status_code=status.HTTP_200_OK,
    response_model=AuthTokenOut,
    summary="ورود با رمز عبور",
    description="""
ورود به سیستم با ایمیل و رمز عبور.

پیش‌نیاز:
- ایمیل باید تایید شده باشد (email_verified=True)

پس از ورود موفق، JWT access token و refresh token صادر می‌شود.
    """
)
async def login_password(
    data: AuthLoginPasswordIn,
    request: Request,
    db: DBSession
) -> AuthTokenOut:
    """ورود با رمز عبور."""
    try:
        ip, user_agent = get_client_info(request)
        
        user = await auth_service.login_with_password(
            db,
            email=data.email,
            password=data.password,
            ip=ip,
            user_agent=user_agent
        )
        
        # تولید tokens
        tokens = auth_service.create_tokens(user.id, user.email)
        
        return AuthTokenOut(**tokens)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    response_model=AuthTokenOut,
    summary="تازه‌سازی access token",
    description="""
تازه‌سازی access token با استفاده از refresh token.

زمانی که access token منقضی شود، می‌توانید با refresh token معتبر،
یک access token جدید دریافت کنید بدون نیاز به ورود مجدد.
    """
)
async def refresh_token(data: AuthRefreshIn) -> AuthTokenOut:
    """تازه‌سازی access token."""
    try:
        tokens = auth_service.refresh_access_token(data.refresh_token)
        return AuthTokenOut(**tokens)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

