"""Location models: Country and City."""
from typing import Optional
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Country(BaseModel):
    """مدل کشور."""
    
    __tablename__ = "country"
    
    # Fields
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    
    # Relationships
    cities: Mapped[list["City"]] = relationship(
        "City",
        back_populates="country",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Country(id={self.id}, name={self.name})>"


class City(BaseModel):
    """مدل شهر."""
    
    __tablename__ = "city"
    __table_args__ = (
        Index("ix_city_country_name", "country_id", "name"),
    )
    
    # Fields
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_id: Mapped[int] = mapped_column(
        ForeignKey("country.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Relationships
    country: Mapped["Country"] = relationship("Country", back_populates="cities")
    
    def __repr__(self) -> str:
        return f"<City(id={self.id}, name={self.name}, country_id={self.country_id})>"

