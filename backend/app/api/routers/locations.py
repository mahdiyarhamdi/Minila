"""Router برای عملیات Location (جستجوی کشورها و شهرها)."""
from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...repositories.location_repo import LocationRepository
from ...schemas.location import (
    CountryOut,
    CountrySearchResult,
    CityOut,
    CitySearchResult
)


router = APIRouter(
    prefix="/api/v1/locations",
    tags=["locations"]
)


def get_location_repo(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> LocationRepository:
    """وابستگی برای دریافت LocationRepository.
    
    Args:
        db: نشست دیتابیس
        
    Returns:
        LocationRepository instance
    """
    return LocationRepository(db)


@router.get(
    "/countries/search",
    response_model=CountrySearchResult,
    summary="جستجوی کشورها",
    description="""
    جستجوی کشورها بر اساس نام (در هر سه زبان: فارسی، انگلیسی، عربی).
    
    این endpoint برای autocomplete در فرم‌ها استفاده می‌شود.
    جستجو در نام‌های فارسی، انگلیسی، عربی و کد ISO انجام می‌شود.
    """,
    responses={
        200: {
            "description": "لیست کشورهای یافت شده",
            "content": {
                "application/json": {
                    "example": {
                        "items": [
                            {
                                "id": 1,
                                "name": "Iran",
                                "name_en": "Iran",
                                "name_fa": "ایران",
                                "name_ar": "إيران",
                                "iso_code": "IR"
                            }
                        ],
                        "total": 1
                    }
                }
            }
        }
    }
)
async def search_countries(
    q: Annotated[str, Query(
        min_length=1,
        max_length=100,
        description="متن جستجو"
    )],
    limit: Annotated[int, Query(
        ge=1,
        le=50,
        description="تعداد نتایج"
    )] = 10,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CountrySearchResult:
    """جستجوی کشورها.
    
    Args:
        q: متن جستجو
        limit: تعداد نتایج
        repo: repository
        
    Returns:
        لیست کشورهای یافت شده
    """
    countries = await repo.search_countries(query=q, limit=limit)
    return CountrySearchResult(
        items=countries,
        total=len(countries)
    )


@router.get(
    "/cities/search",
    response_model=CitySearchResult,
    summary="جستجوی شهرها",
    description="""
    جستجوی شهرها در یک کشور مشخص بر اساس نام (در هر سه زبان).
    
    این endpoint برای autocomplete شهرها استفاده می‌شود.
    فقط شهرهایی که فرودگاه دارند در نتایج نمایش داده می‌شوند.
    جستجو در نام‌های فارسی، انگلیسی، عربی و کد فرودگاه (IATA) انجام می‌شود.
    """,
    responses={
        200: {
            "description": "لیست شهرهای یافت شده",
            "content": {
                "application/json": {
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
            }
        },
        404: {
            "description": "کشور یافت نشد"
        }
    }
)
async def search_cities(
    country_id: Annotated[int, Query(
        ge=1,
        description="شناسه کشور"
    )],
    q: Annotated[str, Query(
        min_length=1,
        max_length=100,
        description="متن جستجو"
    )],
    limit: Annotated[int, Query(
        ge=1,
        le=50,
        description="تعداد نتایج"
    )] = 10,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CitySearchResult:
    """جستجوی شهرها در یک کشور.
    
    Args:
        country_id: شناسه کشور
        q: متن جستجو
        limit: تعداد نتایج
        repo: repository
        
    Returns:
        لیست شهرهای یافت شده
        
    Raises:
        HTTPException: اگر کشور یافت نشود
    """
    # بررسی وجود کشور
    country = await repo.get_country_by_id(country_id)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with id={country_id} not found"
        )
    
    cities = await repo.search_cities_by_country(
        country_id=country_id,
        query=q,
        limit=limit
    )
    return CitySearchResult(
        items=cities,
        total=len(cities)
    )


@router.get(
    "/countries",
    response_model=CountrySearchResult,
    summary="دریافت همه کشورها",
    description="دریافت لیست همه کشورها (برای نمایش اولیه یا انتخاب)"
)
async def get_all_countries(
    limit: Annotated[int, Query(
        ge=1,
        le=250,
        description="حداکثر تعداد"
    )] = 250,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CountrySearchResult:
    """دریافت همه کشورها.
    
    Args:
        limit: حداکثر تعداد
        repo: repository
        
    Returns:
        لیست کشورها
    """
    countries = await repo.get_all_countries(limit=limit)
    return CountrySearchResult(
        items=countries,
        total=len(countries)
    )


@router.get(
    "/countries/{country_id}",
    response_model=CountryOut,
    summary="دریافت اطلاعات یک کشور",
    description="دریافت اطلاعات کامل یک کشور بر اساس ID",
    responses={
        404: {
            "description": "کشور یافت نشد"
        }
    }
)
async def get_country(
    country_id: int,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CountryOut:
    """دریافت اطلاعات کشور.
    
    Args:
        country_id: شناسه کشور
        repo: repository
        
    Returns:
        اطلاعات کشور
        
    Raises:
        HTTPException: اگر کشور یافت نشود
    """
    country = await repo.get_country_by_id(country_id)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with id={country_id} not found"
        )
    return country


@router.get(
    "/cities/{city_id}",
    response_model=CityOut,
    summary="دریافت اطلاعات یک شهر",
    description="دریافت اطلاعات کامل یک شهر بر اساس ID",
    responses={
        404: {
            "description": "شهر یافت نشد"
        }
    }
)
async def get_city(
    city_id: int,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CityOut:
    """دریافت اطلاعات شهر.
    
    Args:
        city_id: شناسه شهر
        repo: repository
        
    Returns:
        اطلاعات شهر
        
    Raises:
        HTTPException: اگر شهر یافت نشود
    """
    city = await repo.get_city_by_id(city_id)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City with id={city_id} not found"
        )
    return city


@router.get(
    "/countries/{country_id}/cities",
    response_model=CitySearchResult,
    summary="دریافت همه شهرهای یک کشور",
    description="دریافت لیست همه شهرهای یک کشور",
    responses={
        404: {
            "description": "کشور یافت نشد"
        }
    }
)
async def get_cities_by_country(
    country_id: int,
    limit: Annotated[int, Query(
        ge=1,
        le=500,
        description="حداکثر تعداد"
    )] = 500,
    repo: Annotated[LocationRepository, Depends(get_location_repo)] = None
) -> CitySearchResult:
    """دریافت همه شهرهای یک کشور.
    
    Args:
        country_id: شناسه کشور
        limit: حداکثر تعداد
        repo: repository
        
    Returns:
        لیست شهرها
        
    Raises:
        HTTPException: اگر کشور یافت نشود
    """
    country = await repo.get_country_by_id(country_id)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with id={country_id} not found"
        )
    
    cities = await repo.get_cities_by_country(country_id=country_id, limit=limit)
    return CitySearchResult(
        items=cities,
        total=len(cities)
    )

