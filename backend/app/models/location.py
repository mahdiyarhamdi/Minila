"""Location models: Country and City."""
from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Country(BaseModel):
    """مدل کشور با پشتیبانی سه زبان."""
    
    __tablename__ = "country"
    
    # Fields - نام به زبان‌های مختلف
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # نام اصلی (انگلیسی)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name_fa: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name_ar: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # ISO code (اختیاری)
    iso_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, unique=True)
    
    # Currency code (ISO 4217 - سه حرفی، مثلاً USD, IRR, AED)
    currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    
    # Relationships
    cities: Mapped[list["City"]] = relationship(
        "City",
        back_populates="country",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Country(id={self.id}, name={self.name}, iso={self.iso_code})>"


class City(BaseModel):
    """مدل شهر با پشتیبانی سه زبان و کد فرودگاه."""
    
    __tablename__ = "city"
    __table_args__ = (
        # Composite indexes for country-based searches
        Index("ix_city_country_name", "country_id", "name"),
        Index("ix_city_country_name_en", "country_id", "name_en"),
        Index("ix_city_country_name_fa", "country_id", "name_fa"),
        Index("ix_city_country_name_ar", "country_id", "name_ar"),
    )
    
    # Fields - نام به زبان‌های مختلف
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # نام اصلی (انگلیسی)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_fa: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # کد فرودگاه (IATA code - سه حرفی)
    airport_code: Mapped[Optional[str]] = mapped_column(
        String(3), 
        nullable=True, 
        index=True,
        comment="IATA airport code"
    )
    
    # Foreign key
    country_id: Mapped[int] = mapped_column(
        ForeignKey("country.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Relationships
    country: Mapped["Country"] = relationship("Country", back_populates="cities")
    
    def __repr__(self) -> str:
        return f"<City(id={self.id}, name={self.name}, airport={self.airport_code}, country_id={self.country_id})>"

