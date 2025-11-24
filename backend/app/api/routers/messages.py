"""Message endpoints."""
from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Depends, Query
from ...api.deps import DBSession, CurrentUser, MessageRateLimit
from ...schemas.message import MessageCreate, MessageOut, ConversationOut
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
**Rate Limit**: 50 پیام در روز

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


@router.get(
    "/conversations",
    status_code=status.HTTP_200_OK,
    summary="لیست مکالمات",
    description="""
دریافت لیست مکالمات کاربر با آخرین پیام و تعداد پیام‌های خوانده نشده.

**Authentication**: الزامی

هر آیتم شامل:
- اطلاعات کاربر مقابل
- آخرین پیام رد و بدل شده
- تعداد پیام‌های خوانده نشده

مکالمات به ترتیب آخرین پیام (جدیدترین) نمایش داده می‌شوند.
    """
)
async def get_conversations_list(
    current_user: CurrentUser,
    db: DBSession
):
    """دریافت لیست مکالمات."""
    result = await message_service.get_conversations(
        db,
        current_user["user_id"]
    )
    return result


@router.get(
    "/unread-count",
    status_code=status.HTTP_200_OK,
    summary="تعداد کل پیام‌های خوانده نشده",
    description="""
دریافت تعداد کل پیام‌های خوانده نشده کاربر.

**Authentication**: الزامی

این endpoint تعداد کل پیام‌هایی که کاربر دریافت کرده ولی هنوز نخوانده را برمی‌گرداند.
برای نمایش در badge نوتیفیکیشن استفاده می‌شود.
    """
)
async def get_unread_count(
    current_user: CurrentUser,
    db: DBSession
):
    """دریافت تعداد پیام‌های خوانده نشده."""
    count = await message_service.get_total_unread_count(
        db,
        current_user["user_id"]
    )
    return {"unread_count": count}


@router.get(
    "/{other_user_id}",
    status_code=status.HTTP_200_OK,
    summary="مکالمه با یک کاربر",
    description="""
دریافت تمام پیام‌های رد و بدل شده با یک کاربر خاص (conversation).

**Authentication**: الزامی

پیام‌ها شامل پیام‌های ارسالی و دریافتی به/از کاربر مشخص‌شده هستند.
پیام‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_conversation(
    other_user_id: int,
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[MessageOut]:
    """دریافت مکالمه با یک کاربر."""
    try:
        result = await message_service.get_conversation(
            db,
            current_user["user_id"],
            other_user_id,
            page,
            page_size
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post(
    "/mark-read/{other_user_id}",
    status_code=status.HTTP_200_OK,
    summary="علامت‌گذاری پیام‌ها به عنوان خوانده شده",
    description="""
علامت‌گذاری تمام پیام‌های خوانده نشده از یک کاربر به عنوان خوانده شده.

**Authentication**: الزامی

این endpoint تمام پیام‌های دریافتی از کاربر مشخص‌شده را که هنوز خوانده نشده‌اند،
به عنوان خوانده شده علامت‌گذاری می‌کند.
    """
)
async def mark_conversation_read(
    other_user_id: int,
    current_user: CurrentUser,
    db: DBSession
):
    """علامت‌گذاری پیام‌ها به عنوان خوانده شده."""
    try:
        count = await message_service.mark_conversation_as_read(
            db,
            current_user["user_id"],
            other_user_id
        )
        return {"message": "پیام‌ها به عنوان خوانده شده علامت‌گذاری شدند", "count": count}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

