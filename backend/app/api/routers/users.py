"""User management endpoints."""
from typing import Tuple, Optional, Annotated
from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from sqlalchemy import select, delete as sql_delete
from sqlalchemy.orm import selectinload
from ...api.deps import DBSession, CurrentUser
from ...schemas.user import UserMeOut, UserUpdate, UserBasicOut
from ...schemas.auth import AuthChangePasswordIn
from ...schemas.membership import RequestOut
from ...schemas.card import CardOut
from ...schemas.community import CommunityOut
from ...services import user_service, community_service, card_service
from ...repositories import membership_repo, community_repo
from ...utils.pagination import PaginatedResponse
from ...models.user_block import UserBlock
from ...models.user import User

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


@router.get(
    "/me/managed-requests",
    status_code=status.HTTP_200_OK,
    response_model=list[RequestOut],
    summary="درخواست‌های عضویت کامیونیتی‌های من",
    description="""
دریافت لیست درخواست‌های عضویت برای کامیونیتی‌هایی که کاربر مالک یا مدیر آن‌هاست.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

فقط درخواست‌های pending (در انتظار بررسی) نمایش داده می‌شوند.
درخواست‌ها به ترتیب قدیمی‌ترین نمایش داده می‌شوند.

این endpoint برای مدیران کامیونیتی‌ها مفید است تا بتوانند درخواست‌های 
دریافتی را از داشبورد خود مشاهده کنند.
    """
)
async def get_managed_requests(
    current_user: CurrentUser,
    db: DBSession
) -> list[RequestOut]:
    """دریافت درخواست‌های عضویت کامیونیتی‌های مدیریت‌شده."""
    requests = await membership_repo.get_managed_communities_requests(db, current_user["user_id"])
    
    result = []
    for request in requests:
        await db.refresh(request, attribute_names=["user", "community"])
        if request.community:
            await db.refresh(request.community, attribute_names=["owner", "avatar"])
        result.append(RequestOut.model_validate(request))
    
    return result


@router.delete(
    "/me/join-requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="لغو درخواست عضویت",
    description="""
لغو درخواست عضویت در کامیونیتی.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

فقط درخواست‌های pending (در انتظار) قابل لغو هستند.
درخواست‌های تایید یا رد شده قابل لغو نیستند.
    """
)
async def cancel_my_join_request(
    request_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> None:
    """لغو درخواست عضویت کاربر جاری."""
    try:
        await community_service.cancel_join_request(
            db,
            request_id=request_id,
            user_id=current_user["user_id"]
        )
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
    "/me/cards",
    status_code=status.HTTP_200_OK,
    summary="دریافت کارت‌های من",
    description="""
دریافت لیست کارت‌های کاربر جاری (paginated).

**احراز هویت**: نیاز به JWT access token در هدر Authorization

کارت‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_my_cards(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[CardOut]:
    """دریافت کارت‌های کاربر جاری."""
    result = await card_service.get_user_cards(
        db,
        user_id=current_user["user_id"],
        page=page,
        page_size=page_size
    )
    return result


@router.get(
    "/me/communities",
    status_code=status.HTTP_200_OK,
    summary="دریافت کامیونیتی‌های من",
    description="""
دریافت لیست کامیونیتی‌هایی که کاربر جاری در آن‌ها عضو است.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

شامل کامیونیتی‌هایی که کاربر owner، manager یا member است.
فیلدهای is_member و my_role برای هر کامیونیتی مقداردهی می‌شوند.
    """
)
async def get_my_communities(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[CommunityOut]:
    """دریافت کامیونیتی‌های کاربر جاری."""
    user_id = current_user["user_id"]
    
    # دریافت عضویت‌های کاربر
    memberships = await membership_repo.get_user_memberships(db, user_id)
    
    # ساخت لیست کامیونیتی‌ها با اطلاعات کامل
    communities = []
    for membership in memberships:
        community = membership.community
        if community:
            # بارگذاری relationها
            await db.refresh(community, attribute_names=["owner", "avatar"])
            
            # محاسبه member_count
            community.member_count = await community_repo.get_member_count(db, community.id)
            
            # تنظیم is_member و my_role
            community.is_member = True
            if membership.role:
                community.my_role = membership.role.name
            else:
                community.my_role = "member"
            
            communities.append(community)
    
    # Pagination دستی (چون داده‌ها از حافظه هستند)
    total = len(communities)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_communities = communities[start:end]
    
    return PaginatedResponse.create(
        items=paginated_communities,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/me/blocked",
    status_code=status.HTTP_200_OK,
    response_model=list[UserBasicOut],
    summary="لیست کاربران بلاک شده",
    description="""
دریافت لیست کاربرانی که توسط کاربر جاری بلاک شده‌اند.

**احراز هویت**: نیاز به JWT access token در هدر Authorization
    """
)
async def get_blocked_users(
    current_user: CurrentUser,
    db: DBSession
) -> list[UserBasicOut]:
    """دریافت لیست کاربران بلاک شده."""
    query = (
        select(UserBlock)
        .where(UserBlock.blocker_id == current_user["user_id"])
        .options(selectinload(UserBlock.blocked))
    )
    result = await db.execute(query)
    blocks = result.scalars().all()
    
    return [UserBasicOut.model_validate(block.blocked) for block in blocks]


@router.post(
    "/block/{user_id}",
    status_code=status.HTTP_201_CREATED,
    summary="بلاک کردن کاربر",
    description="""
بلاک کردن یک کاربر.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

پس از بلاک:
- کاربر بلاک شده نمی‌تواند به شما پیام ارسال کند
- شما می‌توانید هر زمان کاربر را آنبلاک کنید
    """
)
async def block_user(
    user_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> dict[str, str]:
    """بلاک کردن کاربر."""
    blocker_id = current_user["user_id"]
    
    # نمی‌توان خود را بلاک کرد
    if user_id == blocker_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نمی‌توانید خودتان را بلاک کنید"
        )
    
    # بررسی وجود کاربر
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    target_user = user_result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    # بررسی بلاک تکراری
    existing_query = (
        select(UserBlock)
        .where(UserBlock.blocker_id == blocker_id)
        .where(UserBlock.blocked_id == user_id)
    )
    existing_result = await db.execute(existing_query)
    existing_block = existing_result.scalar_one_or_none()
    
    if existing_block:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این کاربر قبلاً بلاک شده است"
        )
    
    # ایجاد بلاک جدید
    new_block = UserBlock(blocker_id=blocker_id, blocked_id=user_id)
    db.add(new_block)
    await db.commit()
    
    return {"message": "کاربر با موفقیت بلاک شد"}


@router.delete(
    "/block/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="آنبلاک کردن کاربر",
    description="""
آنبلاک کردن یک کاربر.

**احراز هویت**: نیاز به JWT access token در هدر Authorization

پس از آنبلاک:
- کاربر دوباره می‌تواند به شما پیام ارسال کند
    """
)
async def unblock_user(
    user_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> None:
    """آنبلاک کردن کاربر."""
    blocker_id = current_user["user_id"]
    
    # بررسی وجود بلاک
    existing_query = (
        select(UserBlock)
        .where(UserBlock.blocker_id == blocker_id)
        .where(UserBlock.blocked_id == user_id)
    )
    existing_result = await db.execute(existing_query)
    existing_block = existing_result.scalar_one_or_none()
    
    if not existing_block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="این کاربر در لیست بلاک شما نیست"
        )
    
    # حذف بلاک
    delete_stmt = (
        sql_delete(UserBlock)
        .where(UserBlock.blocker_id == blocker_id)
        .where(UserBlock.blocked_id == user_id)
    )
    await db.execute(delete_stmt)
    await db.commit()

