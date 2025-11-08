"""Community management endpoints."""
from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Depends, Query
from ...api.deps import DBSession, CurrentUser
from ...schemas.community import CommunityCreate, CommunityUpdate, CommunityOut
from ...schemas.membership import MembershipOut, RequestOut, RequestApproveRejectIn
from ...utils.pagination import PaginatedResponse, get_pagination_params
from ...services import community_service

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


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CommunityOut,
    summary="ایجاد کامیونیتی جدید",
    description="""
ایجاد کامیونیتی جدید توسط کاربر.

**Authentication**: الزامی

کاربر سازنده به‌صورت خودکار owner کامیونیتی می‌شود.
نام کامیونیتی باید یکتا باشد.
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
    """
)
async def get_community(
    community_id: int,
    db: DBSession
) -> CommunityOut:
    """دریافت جزئیات کامیونیتی."""
    try:
        community = await community_service.get_community(db, community_id)
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
    response_model=list[RequestOut],
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
    db: DBSession
) -> list[RequestOut]:
    """دریافت درخواست‌های عضویت."""
    try:
        requests = await community_service.get_join_requests(
            db,
            community_id,
            current_user["user_id"]
        )
        
        return [RequestOut.model_validate(r) for r in requests]
        
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

