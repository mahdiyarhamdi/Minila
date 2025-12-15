"""RoutePrice model for storing base flight prices between cities."""
from datetime import datetime
from typing import Optional
from sqlalchemy import Float, ForeignKey, Index, String, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class RoutePrice(BaseModel):
    """قیمت پایه بلیط بین دو شهر."""
    
    __tablename__ = "route_price"
    __table_args__ = (
        UniqueConstraint("origin_city_id", "destination_city_id", name="uq_route_price_cities"),
        Index("ix_route_price_cities", "origin_city_id", "destination_city_id"),
        Index("ix_route_price_origin", "origin_city_id"),
        Index("ix_route_price_destination", "destination_city_id"),
    )
    
    # Foreign Keys
    origin_city_id: Mapped[int] = mapped_column(
        ForeignKey("city.id", ondelete="CASCADE"),
        nullable=False,
    )
    destination_city_id: Mapped[int] = mapped_column(
        ForeignKey("city.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Price data
    base_ticket_price_usd: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Average ticket price in USD"
    )
    price_per_kg_suggested: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Suggested price per kg (calculated: ticket_price * 0.08 / 23)"
    )
    
    # Metadata
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="manual",
        nullable=False,
        comment="Data source: manual, amadeus, skyscanner, etc."
    )
    
    # Relationships
    origin_city: Mapped["City"] = relationship(
        "City",
        foreign_keys=[origin_city_id],
        lazy="select"
    )
    destination_city: Mapped["City"] = relationship(
        "City",
        foreign_keys=[destination_city_id],
        lazy="select"
    )
    
    def __repr__(self) -> str:
        return f"<RoutePrice(origin={self.origin_city_id}, dest={self.destination_city_id}, price=${self.base_ticket_price_usd})>"
