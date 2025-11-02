"""User management endpoints."""
from fastapi import APIRouter, HTTPException, status, Depends
from ...api.deps import DBSession, CurrentUser
from ...schemas.user import UserMeOut, UserUpdate
from ...services import user_service

router = APIRouter(prefix="/api/v1/users", tags=["users"])


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

