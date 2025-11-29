"""Schemas برای Location (Country و City)."""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ========== Country Schemas ==========

class CountryOut(BaseModel):
    """خروجی Country با نام‌های سه‌زبانه."""
    
    id: int
    name: str
    name_en: str
    name_fa: str
    name_ar: str
    iso_code: Optional[str] = None
    currency_code: Optional[str] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Iran",
                "name_en": "Iran",
                "name_fa": "ایران",
                "name_ar": "إيران",
                "iso_code": "IR",
                "currency_code": "IRR"
            }
        }
    )


class CountrySearchResult(BaseModel):
    """نتایج جستجوی کشورها."""
    
    items: list[CountryOut] = Field(default_factory=list)
    total: int = Field(..., description="تعداد کل نتایج")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": 1,
                        "name": "Iran",
                        "name_en": "Iran",
                        "name_fa": "ایران",
                        "name_ar": "إيران",
                        "iso_code": "IR",
                        "currency_code": "IRR"
                    }
                ],
                "total": 1
            }
        }
    )


# ========== City Schemas ==========

class CityOut(BaseModel):
    """خروجی City با نام‌های سه‌زبانه."""
    
    id: int
    name: str
    name_en: str
    name_fa: str
    name_ar: str
    airport_code: Optional[str] = None
    country_id: int
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Tehran",
                "name_en": "Tehran",
                "name_fa": "تهران",
                "name_ar": "طهران",
                "airport_code": "IKA",
                "country_id": 1
            }
        }
    )


class CityWithCountryOut(BaseModel):
    """خروجی City به همراه اطلاعات Country."""
    
    id: int
    name: str
    name_en: str
    name_fa: str
    name_ar: str
    airport_code: Optional[str] = None
    country_id: int
    country: CountryOut
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Tehran",
                "name_en": "Tehran",
                "name_fa": "تهران",
                "name_ar": "طهران",
                "airport_code": "IKA",
                "country_id": 1,
                "country": {
                    "id": 1,
                    "name": "Iran",
                    "name_en": "Iran",
                    "name_fa": "ایران",
                    "name_ar": "إيران",
                    "iso_code": "IR",
                    "currency_code": "IRR"
                }
            }
        }
    )


class CitySearchResult(BaseModel):
    """نتایج جستجوی شهرها."""
    
    items: list[CityOut] = Field(default_factory=list)
    total: int = Field(..., description="تعداد کل نتایج")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": 1,
                        "name": "Tehran",
                        "name_en": "Tehran",
                        "name_fa": "تهران",
                        "name_ar": "طهران",
                        "airport_code": "IKA",
                        "country_id": 1
                    }
                ],
                "total": 1
            }
        }
    )


# ========== Search Query Parameters ==========

class LocationSearchQuery(BaseModel):
    """پارامترهای جستجوی location."""
    
    q: str = Field(..., min_length=1, max_length=100, description="متن جستجو")
    limit: int = Field(10, ge=1, le=50, description="تعداد نتایج")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "q": "تهران",
                "limit": 10
            }
        }
    )

