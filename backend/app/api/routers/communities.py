"""Community management endpoints."""
from typing import Annotated, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from ...api.deps import DBSession, CurrentUser, get_current_user_optional
from ...schemas.community import CommunityCreate, CommunityUpdate, CommunityOut, SlugCheckResponse
from ...schemas.membership import MembershipOut, RequestOut, RequestApproveRejectIn
from ...utils.pagination import PaginatedResponse, get_pagination_params
from ...services import community_service
from ...repositories import community_repo

router = APIRouter(prefix="/api/v1/communities", tags=["communities"])


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="لیست کامیونیتی‌ها",
    description="""
دریافت لیست تمام کامیونیتی‌ها (paginated).

**Authentication**: اختیاری

نمایش عمومی کامیونیتی‌ها برای همه کاربران.
    """
)
async def get_communities(
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[CommunityOut]:
    """دریافت لیست کامیونیتی‌ها."""
    result = await community_service.get_communities(db, page, page_size)
    return result


@router.get(
    "/check-slug/{slug}",
    status_code=status.HTTP_200_OK,
    response_model=SlugCheckResponse,
    summary="بررسی در دسترس بودن آیدی",
    description="""
بررسی اینکه آیا یک آیدی (slug) در دسترس است یا قبلاً استفاده شده.

**Authentication**: اختیاری

فرمت آیدی:
- باید با حرف انگلیسی شروع شود
- فقط شامل حروف کوچک، اعداد و آندرلاین
- حداقل 3 و حداکثر 50 کاراکتر
    """
)
async def check_slug_availability(
    slug: str,
    db: DBSession
) -> SlugCheckResponse:
    """بررسی در دسترس بودن آیدی."""
    import re
    
    slug = slug.lower().strip()
    
    # بررسی فرمت
    pattern = r'^[a-z][a-z0-9_]{2,49}$'
    if not re.match(pattern, slug):
        return SlugCheckResponse(
            slug=slug,
            available=False,
            message="فرمت نامعتبر: آیدی باید با حرف انگلیسی شروع شود و فقط شامل حروف کوچک، اعداد و آندرلاین باشد (3-50 کاراکتر)"
        )
    
    # بررسی وجود
    exists = await community_repo.slug_exists(db, slug)
    
    if exists:
        return SlugCheckResponse(
            slug=slug,
            available=False,
            message="این آیدی قبلاً استفاده شده است"
        )
    
    return SlugCheckResponse(
        slug=slug,
        available=True,
        message="این آیدی در دسترس است"
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CommunityOut,
    summary="ایجاد کامیونیتی جدید",
    description="""
ایجاد کامیونیتی جدید توسط کاربر.

**Authentication**: الزامی

کاربر سازنده به‌صورت خودکار owner کامیونیتی می‌شود.
نام و آیدی کامیونیتی باید یکتا باشند.
    """
)
async def create_community(
    data: CommunityCreate,
    current_user: CurrentUser,
    db: DBSession
) -> CommunityOut:
    """ایجاد کامیونیتی جدید."""
    try:
        community = await community_service.create_community(
            db,
            owner_id=current_user["user_id"],
            name=data.name,
            slug=data.slug,
            bio=data.bio,
            avatar_id=data.avatar_id
        )
        return CommunityOut.model_validate(community)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/{community_id}",
    status_code=status.HTTP_200_OK,
    response_model=CommunityOut,
    summary="جزئیات کامیونیتی",
    description="""
دریافت اطلاعات کامل یک کامیونیتی.

**Authentication**: اختیاری

اگر کاربر لاگین کرده باشد، فیلدهای `is_member` و `my_role` مقداردهی می‌شوند.
    """
)
async def get_community(
    community_id: int,
    db: DBSession,
    current_user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None
) -> CommunityOut:
    """دریافت جزئیات کامیونیتی."""
    try:
        user_id = current_user["user_id"] if current_user else None
        community = await community_service.get_community(db, community_id, user_id)
        return CommunityOut.model_validate(community)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch(
    "/{community_id}",
    status_code=status.HTTP_200_OK,
    response_model=CommunityOut,
    summary="ویرایش کامیونیتی",
    description="""
ویرایش اطلاعات کامیونیتی.

**Authentication**: الزامی  
**Authorization**: فقط owner یا manager کامیونیتی

فیلدهای قابل ویرایش:
- name: نام کامیونیتی
- bio: توضیحات
- avatar_id: شناسه آواتار
    """
)
async def update_community(
    community_id: int,
    data: CommunityUpdate,
    current_user: CurrentUser,
    db: DBSession
) -> CommunityOut:
    """ویرایش کامیونیتی."""
    try:
        updates = data.model_dump(exclude_unset=True)
        
        community = await community_service.update_community(
            db,
            community_id,
            current_user["user_id"],
            **updates
        )
        
        return CommunityOut.model_validate(community)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/{community_id}/join",
    status_code=status.HTTP_201_CREATED,
    response_model=RequestOut,
    summary="درخواست عضویت",
    description="""
ارسال درخواست عضویت در کامیونیتی.

**Authentication**: الزامی

درخواست در وضعیت pending قرار می‌گیرد تا توسط مدیران بررسی شود.
نمی‌توان درخواست تکراری ارسال کرد.
    """
)
async def join_community(
    community_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> RequestOut:
    """درخواست عضویت در کامیونیتی."""
    try:
        request = await community_service.join_request(
            db,
            current_user["user_id"],
            community_id
        )
        
        return RequestOut.model_validate(request)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/{community_id}/requests",
    status_code=status.HTTP_200_OK,
    summary="لیست درخواست‌های عضویت",
    description="""
دریافت لیست درخواست‌های عضویت pending.

**Authentication**: الزامی  
**Authorization**: فقط manager یا owner کامیونیتی
    """
)
async def get_join_requests(
    community_id: int,
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[RequestOut]:
    """دریافت درخواست‌های عضویت."""
    try:
        result = await community_service.get_join_requests(
            db,
            community_id,
            current_user["user_id"],
            page,
            page_size
        )
        
        return result
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/{community_id}/requests/{request_id}/approve",
    status_code=status.HTTP_200_OK,
    response_model=MembershipOut,
    summary="تایید درخواست عضویت",
    description="""
تایید درخواست عضویت و ایجاد membership.

**Authentication**: الزامی  
**Authorization**: فقط manager یا owner کامیونیتی

پس از تایید:
- Membership با role=member ایجاد می‌شود
- ایمیل نتیجه به کاربر ارسال می‌شود
- رویداد join_approve ثبت می‌شود
    """
)
async def approve_join_request(
    community_id: int,
    request_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> MembershipOut:
    """تایید درخواست عضویت."""
    try:
        membership = await community_service.handle_request(
            db,
            request_id,
            current_user["user_id"],
            approve=True
        )
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="خطا در ایجاد عضویت"
            )
        
        return MembershipOut.model_validate(membership)
        
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


@router.post(
    "/{community_id}/requests/{request_id}/reject",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="رد درخواست عضویت",
    description="""
رد درخواست عضویت.

**Authentication**: الزامی  
**Authorization**: فقط manager یا owner کامیونیتی

پس از رد:
- درخواست با is_approved=false علامت می‌خورد
- ایمیل نتیجه به کاربر ارسال می‌شود
- رویداد join_reject ثبت می‌شود
    """
)
async def reject_join_request(
    community_id: int,
    request_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> None:
    """رد درخواست عضویت."""
    try:
        await community_service.handle_request(
            db,
            request_id,
            current_user["user_id"],
            approve=False
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
    "/{community_id}/members",
    status_code=status.HTTP_200_OK,
    summary="لیست اعضای کامیونیتی",
    description="""
دریافت لیست اعضای فعال کامیونیتی (paginated).

**Authentication**: اختیاری

نمایش عمومی اعضای کامیونیتی.
    """
)
async def get_community_members(
    community_id: int,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20
) -> PaginatedResponse[MembershipOut]:
    """دریافت اعضای کامیونیتی."""
    try:
        result = await community_service.get_members(db, community_id, page, page_size)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch(
    "/{community_id}/members/{user_id}/role",
    status_code=status.HTTP_200_OK,
    response_model=MembershipOut,
    summary="تغییر نقش عضو",
    description="""
تغییر نقش یک عضو در کامیونیتی.

**Authentication**: الزامی  
**Authorization**: فقط owner کامیونیتی

نقش‌های مجاز:
- member: عضو عادی
- manager: مدیر (می‌تواند درخواست‌ها را مدیریت کند)

نکته: نقش owner قابل تغییر نیست.
    """
)
async def change_member_role(
    community_id: int,
    user_id: int,
    role: str = Query(..., description="نقش جدید: member یا manager"),
    current_user: CurrentUser = None,
    db: DBSession = None
) -> MembershipOut:
    """تغییر نقش عضو در کامیونیتی."""
    try:
        membership = await community_service.change_member_role(
            db,
            community_id=community_id,
            target_user_id=user_id,
            new_role=role,
            actor_user_id=current_user["user_id"]
        )
        return MembershipOut.model_validate(membership)
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


@router.delete(
    "/{community_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="حذف عضو از کامیونیتی",
    description="""
حذف یک عضو از کامیونیتی.

**Authentication**: الزامی  
**Authorization**: owner یا manager کامیونیتی

نکته: owner قابل حذف نیست.
    """
)
async def remove_community_member(
    community_id: int,
    user_id: int,
    current_user: CurrentUser = None,
    db: DBSession = None
) -> None:
    """حذف عضو از کامیونیتی."""
    try:
        await community_service.remove_member(
            db,
            community_id=community_id,
            target_user_id=user_id,
            actor_user_id=current_user["user_id"]
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

