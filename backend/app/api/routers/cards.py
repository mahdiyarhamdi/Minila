"""Card management endpoints."""
from typing import Annotated, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
from ...api.deps import DBSession, CurrentUser, CurrentUserOptional
from ...schemas.card import CardCreate, CardUpdate, CardFilter, CardOut
from ...schemas.price import PriceSuggestionOut
from ...utils.pagination import PaginatedResponse
from ...services import card_service
from ...services.dynamic_pricing_service import dynamic_pricing_service

router = APIRouter(prefix="/api/v1/cards", tags=["cards"])


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="جست‌وجوی کارت‌ها",
    description="""
جست‌وجو و فیلتر کارت‌های سفر و بار (paginated).

**Authentication**: اختیاری

فیلترهای موجود:
- origin_country_id: کشور مبدأ
- origin_city_id: شهر مبدأ
- destination_country_id: کشور مقصد
- destination_city_id: شهر مقصد
- is_sender: نوع کارت (true=فرستنده، false=مسافر)
- product_classification_id: دسته‌بندی محصول
- is_packed: وضعیت بسته‌بندی
- community_id: کامیونیتی خاص
- start_date/end_date: بازه زمانی
- min_weight/max_weight: محدوده وزن

کارت‌ها به ترتیب جدیدترین نمایش داده می‌شوند.
    """
)
async def get_cards(
    db: DBSession,
    current_user: CurrentUserOptional,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    origin_country_id: Optional[int] = None,
    origin_city_id: Optional[int] = None,
    destination_country_id: Optional[int] = None,
    destination_city_id: Optional[int] = None,
    is_sender: Optional[bool] = None,
    product_classification_id: Optional[int] = None,
    is_packed: Optional[bool] = None,
    community_id: Optional[int] = None,
    min_weight: Optional[float] = None,
    max_weight: Optional[float] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    currency: Optional[str] = None
) -> PaginatedResponse[CardOut]:
    """جست‌وجوی کارت‌ها با فیلتر."""
    from datetime import datetime
    
    filters = CardFilter(
        origin_country_id=origin_country_id,
        origin_city_id=origin_city_id,
        destination_country_id=destination_country_id,
        destination_city_id=destination_city_id,
        is_sender=is_sender,
        product_classification_id=product_classification_id,
        is_packed=is_packed,
        community_id=community_id,
        min_weight=min_weight,
        max_weight=max_weight,
        date_from=datetime.fromisoformat(date_from.replace('Z', '+00:00')) if date_from else None,
        date_to=datetime.fromisoformat(date_to.replace('Z', '+00:00')) if date_to else None,
        min_price=min_price,
        max_price=max_price,
        currency=currency
    )
    
    result = await card_service.get_cards(db, filters, page, page_size)
    return result


@router.get(
    "/price-suggestion/",
    status_code=status.HTTP_200_OK,
    response_model=PriceSuggestionOut,
    summary="پیشنهاد قیمت",
    description="""
دریافت قیمت پیشنهادی به ازای هر کیلوگرم برای یک مسیر.

**Authentication**: اختیاری

این endpoint یک قیمت پیشنهادی بر اساس عوامل زیر محاسبه می‌کند:
- **Base Price**: قیمت پایه از جدول مسیرها
- **Route Factor**: بر اساس محبوبیت مسیر
- **Season Factor**: بر اساس فصل سفر (نوروز، تابستان، ...)
- **Demand Factor**: نسبت عرضه/تقاضا (Surge Pricing مشابه اسنپ)
- **Urgency Factor**: فوریت سفر
- **Weight Factor**: تخفیف برای وزن بالا
- **Category Factor**: نوع محصول

خروجی شامل:
- قیمت پیشنهادی
- بازه قیمت (min/max)
- سطح اطمینان (high/medium/low)
- جزئیات محاسبه (breakdown)
    """
)
async def get_price_suggestion(
    db: DBSession,
    origin_city_id: int = Query(..., description="شناسه شهر مبدأ"),
    destination_city_id: int = Query(..., description="شناسه شهر مقصد"),
    travel_date: Optional[str] = Query(None, description="تاریخ سفر (ISO format)"),
    weight: Optional[float] = Query(None, ge=0, description="وزن بسته (کیلوگرم)"),
    category_id: Optional[int] = Query(None, description="شناسه دسته‌بندی محصول")
) -> PriceSuggestionOut:
    """دریافت قیمت پیشنهادی برای مسیر."""
    # Parse travel date if provided
    parsed_date = None
    if travel_date:
        try:
            parsed_date = datetime.fromisoformat(travel_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use ISO format (e.g., 2025-07-15T10:00:00)"
            )
    
    # Calculate price suggestion
    suggestion = await dynamic_pricing_service.calculate_price(
        db=db,
        origin_city_id=origin_city_id,
        destination_city_id=destination_city_id,
        travel_date=parsed_date,
        weight=weight,
        category_id=category_id
    )
    
    return suggestion


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CardOut,
    summary="ایجاد کارت جدید",
    description="""
ایجاد کارت سفر یا بار جدید.

**Authentication**: الزامی

نوع کارت:
- is_sender=true: کارت فرستنده کالا (نیاز به بازه زمانی)
- is_sender=false: کارت مسافر (نیاز به تاریخ دقیق)

نمایش کارت:
- اگر community_ids مشخص نشود: نمایش سراسری
- اگر community_ids مشخص شود: فقط در آن کامیونیتی‌ها نمایش داده می‌شود

پس از ایجاد موفق، رویداد card_create ثبت می‌شود.
    """
)
async def create_card(
    data: CardCreate,
    current_user: CurrentUser,
    db: DBSession
) -> CardOut:
    """ایجاد کارت جدید."""
    try:
        card = await card_service.create_card(
            db,
            owner_id=current_user["user_id"],
            is_sender=data.is_sender,
            origin_country_id=data.origin_country_id,
            origin_city_id=data.origin_city_id,
            destination_country_id=data.destination_country_id,
            destination_city_id=data.destination_city_id,
            start_time_frame=data.start_time_frame,
            end_time_frame=data.end_time_frame,
            ticket_date_time=data.ticket_date_time,
            weight=data.weight,
            is_packed=data.is_packed,
            price_aed=data.price_aed,
            currency=data.currency,
            description=data.description,
            product_classification_id=data.product_classification_id,
            community_ids=data.community_ids
        )
        
        return CardOut.model_validate(card)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/{card_id}",
    status_code=status.HTTP_200_OK,
    response_model=CardOut,
    summary="جزئیات کارت",
    description="""
دریافت اطلاعات کامل یک کارت.

**Authentication**: اختیاری

شامل اطلاعات صاحب کارت، مبدأ و مقصد، جزئیات بسته و ...
    """
)
async def get_card(
    card_id: int,
    db: DBSession
) -> CardOut:
    """دریافت جزئیات کارت."""
    try:
        card = await card_service.get_card(db, card_id)
        return CardOut.model_validate(card)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch(
    "/{card_id}",
    status_code=status.HTTP_200_OK,
    response_model=CardOut,
    summary="ویرایش کارت",
    description="""
ویرایش اطلاعات کارت.

**Authentication**: الزامی  
**Authorization**: فقط صاحب کارت

فیلدهای قابل ویرایش:
- مبدأ و مقصد
- زمان سفر
- وزن و قیمت
- توضیحات
- دسته‌بندی محصول
- وضعیت بسته‌بندی

همه فیلدها اختیاری هستند. فقط فیلدهایی که ارسال شوند آپدیت می‌شوند.
    """
)
async def update_card(
    card_id: int,
    data: CardUpdate,
    current_user: CurrentUser,
    db: DBSession
) -> CardOut:
    """ویرایش کارت."""
    try:
        updates = data.model_dump(exclude_unset=True)
        
        card = await card_service.update_card(
            db,
            card_id,
            current_user["user_id"],
            **updates
        )
        
        return CardOut.model_validate(card)
        
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


@router.delete(
    "/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="حذف کارت",
    description="""
حذف کارت.

**Authentication**: الزامی  
**Authorization**: فقط صاحب کارت

در این نسخه MVP، کارت به‌صورت کامل حذف می‌شود (hard delete).
در نسخه‌های بعدی soft delete پیاده‌سازی خواهد شد.

پس از حذف موفق، رویداد card_delete ثبت می‌شود.
    """
)
async def delete_card(
    card_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> None:
    """حذف کارت."""
    try:
        await card_service.delete_card(
            db,
            card_id,
            current_user["user_id"]
        )
        
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

