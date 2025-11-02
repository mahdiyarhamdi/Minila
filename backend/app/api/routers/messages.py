"""Message endpoints."""
from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Depends, Query
from ...api.deps import DBSession, CurrentUser, MessageRateLimit
from ...schemas.message import MessageCreate, MessageOut
from ...utils.pagination import PaginatedResponse
from ...services import message_service

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=MessageOut,
    summary="ارسال پیام",
    description="""
ارسال پیام به کاربر دیگر.

**Authentication**: الزامی  
**Rate Limit**: 5 پیام در روز

**قید مهم**: فرستنده و گیرنده باید حداقل یک کامیونیتی مشترک داشته باشند.
بدون کامیونیتی مشترک، ارسال پیام با خطای 403 Forbidden مواجه می‌شود.

پس از ارسال موفق:
- پیام ذخیره می‌شود
- ایمیل notification به گیرنده ارسال می‌شود
- رویداد message_send ثبت می‌شود

در صورت عدم کامیونیتی مشترک:
- رویداد message_blocked ثبت می‌شود
- خطای 403 برگردانده می‌شود
    """
)
async def send_message(
    data: MessageCreate,
    current_user: CurrentUser,
    db: DBSession,
    _: MessageRateLimit  # Rate limit check
) -> MessageOut:
    """ارسال پیام."""
    try:
        message = await message_service.send_message(
            db,
            sender_id=current_user["user_id"],
            receiver_id=data.receiver_id,
            body=data.body
        )
        
        return MessageOut.model_validate(message)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get(
    "/inbox",
    status_code=status.HTTP_200_OK,
    summary="پیام‌های دریافتی",
    description="""
دریافت لیست پیام‌های دریافتی کاربر (paginated).

**Authentication**: الزامی

پیام‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_inbox(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[MessageOut]:
    """دریافت پیام‌های دریافتی."""
    result = await message_service.get_inbox(
        db,
        current_user["user_id"],
        page,
        page_size
    )
    return result


@router.get(
    "/sent",
    status_code=status.HTTP_200_OK,
    summary="پیام‌های ارسالی",
    description="""
دریافت لیست پیام‌های ارسالی کاربر (paginated).

**Authentication**: الزامی

پیام‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_sent(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[MessageOut]:
    """دریافت پیام‌های ارسالی."""
    result = await message_service.get_sent(
        db,
        current_user["user_id"],
        page,
        page_size
    )
    return result

