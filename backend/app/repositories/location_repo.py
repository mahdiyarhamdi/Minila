"""Repository برای عملیات Location (Country و City)."""
from typing import Optional
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.location import Country, City


class LocationRepository:
    """Repository برای مدیریت کشورها و شهرها."""
    
    def __init__(self, session: AsyncSession):
        """مقداردهی اولیه.
        
        Args:
            session: نشست async دیتابیس
        """
        self.session = session
    
    async def search_countries(
        self,
        query: str,
        limit: int = 10
    ) -> list[Country]:
        """جستجوی کشورها بر اساس نام (در هر سه زبان).
        
        Args:
            query: متن جستجو
            limit: تعداد نتایج
            
        Returns:
            لیست کشورها
        """
        search_term = f"%{query.lower()}%"
        
        stmt = select(Country).where(
            or_(
                func.lower(Country.name_en).like(search_term),
                func.lower(Country.name_fa).like(search_term),
                func.lower(Country.name_ar).like(search_term),
                func.lower(Country.iso_code).like(search_term)
            )
        ).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def search_cities_by_country(
        self,
        country_id: int,
        query: str,
        limit: int = 10
    ) -> list[City]:
        """جستجوی شهرها در یک کشور بر اساس نام (در هر سه زبان).
        
        Args:
            country_id: شناسه کشور
            query: متن جستجو
            limit: تعداد نتایج
            
        Returns:
            لیست شهرها
        """
        search_term = f"%{query.lower()}%"
        
        stmt = select(City).where(
            City.country_id == country_id,
            or_(
                func.lower(City.name_en).like(search_term),
                func.lower(City.name_fa).like(search_term),
                func.lower(City.name_ar).like(search_term),
                func.lower(City.airport_code).like(search_term)
            )
        ).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_country_by_id(self, country_id: int) -> Optional[Country]:
        """دریافت کشور بر اساس ID.
        
        Args:
            country_id: شناسه کشور
            
        Returns:
            کشور یا None
        """
        stmt = select(Country).where(Country.id == country_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_city_by_id(self, city_id: int) -> Optional[City]:
        """دریافت شهر بر اساس ID.
        
        Args:
            city_id: شناسه شهر
            
        Returns:
            شهر یا None
        """
        stmt = select(City).where(City.id == city_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all_countries(self, limit: int = 250) -> list[Country]:
        """دریافت همه کشورها.
        
        Args:
            limit: حداکثر تعداد
            
        Returns:
            لیست کشورها
        """
        stmt = select(Country).order_by(Country.name_en).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_cities_by_country(
        self,
        country_id: int,
        limit: int = 500
    ) -> list[City]:
        """دریافت همه شهرهای یک کشور.
        
        Args:
            country_id: شناسه کشور
            limit: حداکثر تعداد
            
        Returns:
            لیست شهرها
        """
        stmt = select(City).where(
            City.country_id == country_id
        ).order_by(City.name_en).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

