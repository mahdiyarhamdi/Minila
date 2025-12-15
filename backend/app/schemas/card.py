"""Card schemas برای کارت‌های سفر و بسته."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut, CountryOut, CityOut
from .community import CommunityBasicOut


# ========== Product Classification Schema ==========

class ProductClassificationOut(BaseModel):
    """خروجی ProductClassification."""
    
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)


# ========== Card Schemas ==========

class CardCreate(BaseModel):
    """ایجاد Card جدید."""
    
    # نوع کارت
    is_sender: bool = Field(..., description="true=فرستنده کالا، false=مسافر")
    
    # مبدأ و مقصد
    origin_country_id: int = Field(..., description="شناسه کشور مبدأ")
    origin_city_id: int = Field(..., description="شناسه شهر مبدأ")
    destination_country_id: int = Field(..., description="شناسه کشور مقصد")
    destination_city_id: int = Field(..., description="شناسه شهر مقصد")
    
    # زمان
    start_time_frame: Optional[datetime] = Field(None, description="شروع بازه زمانی (برای فرستنده)")
    end_time_frame: Optional[datetime] = Field(None, description="پایان بازه زمانی (برای فرستنده)")
    ticket_date_time: Optional[datetime] = Field(None, description="تاریخ دقیق سفر (برای مسافر)")
    
    # جزئیات بسته
    weight: Optional[float] = Field(None, ge=0, description="وزن (کیلوگرم)")
    is_packed: Optional[bool] = Field(None, description="وضعیت بسته‌بندی")
    price_per_kg: Optional[float] = Field(None, ge=0, description="قیمت به ازای هر کیلوگرم")
    price_aed: Optional[float] = Field(None, ge=0, description="قیمت کل (قدیمی - برای backward compatibility)")
    currency: Optional[str] = Field("USD", max_length=3, description="واحد پول (ISO 4217)")
    description: Optional[str] = Field(None, max_length=2000, description="توضیحات")
    product_classification_id: Optional[int] = Field(None, description="شناسه دسته‌بندی محصول")
    
    # کامیونیتی‌های نمایش (اختیاری - اگر خالی باشد، سراسری نمایش داده می‌شود)
    community_ids: Optional[list[int]] = Field(None, description="لیست کامیونیتی‌ها برای نمایش محدود")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_sender": False,
                "origin_country_id": 1,
                "origin_city_id": 1,
                "destination_country_id": 2,
                "destination_city_id": 10,
                "ticket_date_time": "2024-02-15T10:00:00",
                "weight": 5.0,
                "is_packed": True,
                "price_aed": 50.0,
                "currency": "USD",
                "description": "می‌توانم بسته کوچک حمل کنم",
                "product_classification_id": 1,
                "community_ids": [1, 2]
            }
        }
    )


class CardUpdate(BaseModel):
    """ویرایش Card (همه فیلدها اختیاری)."""
    
    is_sender: Optional[bool] = None
    origin_country_id: Optional[int] = None
    origin_city_id: Optional[int] = None
    destination_country_id: Optional[int] = None
    destination_city_id: Optional[int] = None
    start_time_frame: Optional[datetime] = None
    end_time_frame: Optional[datetime] = None
    ticket_date_time: Optional[datetime] = None
    weight: Optional[float] = Field(None, ge=0)
    is_packed: Optional[bool] = None
    price_per_kg: Optional[float] = Field(None, ge=0, description="قیمت به ازای هر کیلوگرم")
    price_aed: Optional[float] = Field(None, ge=0, description="قیمت کل (قدیمی)")
    currency: Optional[str] = Field(None, max_length=3, description="واحد پول (ISO 4217)")
    description: Optional[str] = Field(None, max_length=2000)
    product_classification_id: Optional[int] = None
    community_ids: Optional[list[int]] = Field(None, description="لیست کامیونیتی‌ها برای نمایش محدود")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "description": "توضیحات جدید",
                "price_per_kg": 2.5,
                "currency": "USD"
            }
        }
    )


class CardFilter(BaseModel):
    """فیلترهای جست‌وجوی Card."""
    
    origin_country_id: Optional[int] = Field(None, description="فیلتر بر اساس کشور مبدأ")
    origin_city_id: Optional[int] = Field(None, description="فیلتر بر اساس شهر مبدأ")
    destination_country_id: Optional[int] = Field(None, description="فیلتر بر اساس کشور مقصد")
    destination_city_id: Optional[int] = Field(None, description="فیلتر بر اساس شهر مقصد")
    is_sender: Optional[bool] = Field(None, description="فیلتر بر اساس نوع کارت")
    product_classification_id: Optional[int] = Field(None, description="فیلتر بر اساس دسته‌بندی محصول")
    is_packed: Optional[bool] = Field(None, description="فیلتر بر اساس وضعیت بسته‌بندی")
    community_id: Optional[int] = Field(None, description="فیلتر بر اساس کامیونیتی")
    date_from: Optional[datetime] = Field(None, description="فیلتر از تاریخ")
    date_to: Optional[datetime] = Field(None, description="فیلتر تا تاریخ")
    min_weight: Optional[float] = Field(None, ge=0, description="حداقل وزن")
    max_weight: Optional[float] = Field(None, ge=0, description="حداکثر وزن")
    min_price_per_kg: Optional[float] = Field(None, ge=0, description="حداقل قیمت به ازای هر کیلوگرم")
    max_price_per_kg: Optional[float] = Field(None, ge=0, description="حداکثر قیمت به ازای هر کیلوگرم")
    min_price: Optional[float] = Field(None, ge=0, description="حداقل قیمت کل (قدیمی)")
    max_price: Optional[float] = Field(None, ge=0, description="حداکثر قیمت کل (قدیمی)")
    currency: Optional[str] = Field(None, max_length=3, description="واحد پول")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "origin_country_id": 1,
                "origin_city_id": 1,
                "destination_country_id": 2,
                "destination_city_id": 10,
                "is_sender": False,
                "product_classification_id": 1,
                "start_date": "2024-02-01T00:00:00",
                "end_date": "2024-02-28T23:59:59"
            }
        }
    )


class CardOut(BaseModel):
    """خروجی ساده Card با اطلاعات owner."""
    
    id: int
    owner: UserBasicOut
    is_sender: bool
    origin_country: CountryOut
    origin_city: CityOut
    destination_country: CountryOut
    destination_city: CityOut
    start_time_frame: Optional[datetime] = None
    end_time_frame: Optional[datetime] = None
    ticket_date_time: Optional[datetime] = None
    weight: Optional[float] = None
    is_packed: Optional[bool] = None
    price_per_kg: Optional[float] = None
    price_aed: Optional[float] = None
    is_legacy_price: Optional[bool] = None
    total_price: Optional[float] = None  # Computed: price_per_kg × weight
    currency: Optional[str] = None
    description: Optional[str] = None
    product_classification: Optional[ProductClassificationOut] = None
    created_at: datetime
    # Analytics (optional, only returned for owner's cards)
    view_count: Optional[int] = None
    click_count: Optional[int] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "is_sender": False,
                "origin_country": {"id": 1, "name": "ایران"},
                "origin_city": {"id": 1, "name": "تهران", "country_id": 1},
                "destination_country": {"id": 2, "name": "امارات"},
                "destination_city": {"id": 10, "name": "دبی", "country_id": 2},
                "ticket_date_time": "2024-02-15T10:00:00",
                "weight": 5.0,
                "is_packed": True,
                "price_per_kg": 2.5,
                "total_price": 12.5,
                "currency": "USD",
                "description": "می‌توانم بسته کوچک حمل کنم",
                "product_classification": {"id": 1, "name": "پوشاک"},
                "created_at": "2024-01-01T12:00:00",
                "view_count": 150,
                "click_count": 42
            }
        }
    )


class CardDetailOut(CardOut):
    """خروجی جزئیات کامل Card با communities."""
    
    communities: list[CommunityBasicOut] = Field(default_factory=list, description="کامیونیتی‌هایی که کارت در آن‌ها نمایش داده می‌شود")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "owner": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "is_sender": False,
                "origin_country": {"id": 1, "name": "ایران"},
                "origin_city": {"id": 1, "name": "تهران", "country_id": 1},
                "destination_country": {"id": 2, "name": "امارات"},
                "destination_city": {"id": 10, "name": "دبی", "country_id": 2},
                "ticket_date_time": "2024-02-15T10:00:00",
                "weight": 5.0,
                "is_packed": True,
                "price_aed": 50.0,
                "currency": "USD",
                "description": "می‌توانم بسته کوچک حمل کنم",
                "product_classification": {"id": 1, "name": "پوشاک"},
                "communities": [
                    {"id": 1, "name": "کامیونیتی مسافران تهران", "bio": "توضیحات"}
                ],
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )


class CardStatsOut(BaseModel):
    """آمار بازدید و کلیک کارت."""
    
    card_id: int
    view_count: int = Field(..., description="تعداد بازدید (impression)")
    click_count: int = Field(..., description="تعداد کلیک")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": 1,
                "view_count": 150,
                "click_count": 42
            }
        }
    )

