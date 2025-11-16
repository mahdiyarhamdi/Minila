"""User management endpoints."""
from typing import Tuple, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request
from ...api.deps import DBSession, CurrentUser
from ...schemas.user import UserMeOut, UserUpdate
from ...schemas.auth import AuthChangePasswordIn
from ...schemas.membership import RequestOut
from ...services import user_service
from ...repositories import membership_repo

router = APIRouter(prefix="/api/v1/users", tags=["users"])


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


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=UserMeOut,
    summary="دریافت پروفایل کاربر جاری",
    description="""
دریافت اطلاعات کامل پروفایل کاربر جاری.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

این endpoint اطلاعات کامل کاربر شامل avatar، country و city را برمی‌گرداند.
    """
)
async def get_my_profile(
    current_user: CurrentUser,
    db: DBSession
) -> UserMeOut:
    """دریافت پروفایل کاربر جاری."""
    try:
        user = await user_service.get_profile(db, current_user["user_id"])
        return UserMeOut.model_validate(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=UserMeOut,
    summary="ویرایش پروفایل کاربر جاری",
    description="""
ویرایش اطلاعات پروفایل کاربر جاری.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

فیلدهای قابل ویرایش:
- first_name: نام
- last_name: نام خانوادگی
- national_id: کد ملی
- gender: جنسیت
- birthday: تاریخ تولد
- postal_code: کد پستی
- avatar_id: شناسه آواتار
- country_id: شناسه کشور
- city_id: شناسه شهر

همه فیلدها اختیاری هستند. فقط فیلدهایی که ارسال شوند آپدیت می‌شوند.
    """
)
async def update_my_profile(
    data: UserUpdate,
    current_user: CurrentUser,
    db: DBSession
) -> UserMeOut:
    """ویرایش پروفایل کاربر جاری."""
    try:
        # تبدیل Pydantic model به dict و حذف None values
        updates = data.model_dump(exclude_unset=True)
        
        user = await user_service.update_profile(
            db,
            current_user["user_id"],
            **updates
        )
        
        return UserMeOut.model_validate(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/me/password",
    status_code=status.HTTP_200_OK,
    summary="تغییر رمز عبور",
    description="""
تغییر رمز عبور کاربر جاری.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

برای تغییر رمز عبور باید:
1. رمز عبور فعلی را وارد کنید (برای تایید هویت)
2. رمز عبور جدید را وارد کنید (حداقل 8 کاراکتر)

پس از تغییر موفق، رویداد password_changed ثبت می‌شود.
    """
)
async def change_password(
    data: AuthChangePasswordIn,
    request: Request,
    current_user: CurrentUser,
    db: DBSession
) -> dict[str, str]:
    """تغییر رمز عبور کاربر جاری."""
    try:
        ip, user_agent = get_client_info(request)
        
        await user_service.change_password(
            db,
            user_id=current_user["user_id"],
            old_password=data.old_password,
            new_password=data.new_password,
            ip=ip,
            user_agent=user_agent
        )
        
        return {
            "message": "رمز عبور با موفقیت تغییر کرد"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/me/join-requests",
    status_code=status.HTTP_200_OK,
    response_model=list[RequestOut],
    summary="لیست درخواست‌های عضویت من",
    description="""
دریافت لیست تمام درخواست‌های عضویت کاربر جاری در کامیونیتی‌ها.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

شامل درخواست‌های:
- pending: در انتظار بررسی (is_approved=null)
- approved: تایید شده (is_approved=true)
- rejected: رد شده (is_approved=false)

درخواست‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_my_join_requests(
    current_user: CurrentUser,
    db: DBSession
) -> list[RequestOut]:
    """دریافت درخواست‌های عضویت کاربر جاری."""
    requests = await membership_repo.get_user_requests(db, current_user["user_id"])
    
    result = []
    for request in requests:
        await db.refresh(request, attribute_names=["user", "community"])
        if request.community:
            await db.refresh(request.community, attribute_names=["owner", "avatar"])
        result.append(RequestOut.model_validate(request))
    
    return result

