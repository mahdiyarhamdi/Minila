"""Card and CardCommunity models."""
from typing import Optional
from datetime import datetime
from sqlalchemy import (
    Boolean, CheckConstraint, DateTime, Float, ForeignKey,
    Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Card(BaseModel):
    """مدل کارت (سفر یا بسته)."""
    
    __tablename__ = "card"
    __table_args__ = (
        CheckConstraint(
            "(end_time_frame IS NULL) OR (start_time_frame IS NULL) OR (end_time_frame >= start_time_frame)",
            name="check_timeframe_order"
        ),
        Index("ix_card_origin_city_id", "origin_city_id"),
        Index("ix_card_destination_city_id", "destination_city_id"),
        Index("ix_card_start_time_frame", "start_time_frame"),
        Index("ix_card_end_time_frame", "end_time_frame"),
        Index("ix_card_product_classification_id", "product_classification_id"),
        Index("ix_card_is_packed", "is_packed"),
    )
    
    # Foreign Keys
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    origin_country_id: Mapped[int] = mapped_column(
        ForeignKey("country.id", ondelete="RESTRICT"),
        nullable=False,
    )
    origin_city_id: Mapped[int] = mapped_column(
        ForeignKey("city.id", ondelete="RESTRICT"),
        nullable=False,
    )
    destination_country_id: Mapped[int] = mapped_column(
        ForeignKey("country.id", ondelete="RESTRICT"),
        nullable=False,
    )
    destination_city_id: Mapped[int] = mapped_column(
        ForeignKey("city.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_classification_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("product_classification.id", ondelete="RESTRICT"),
        nullable=True,
    )
    
    # Fields
    is_sender: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        comment="1=فرستنده کالا, 0=مسافر"
    )
    
    # Time fields (برای فرستنده‌ها بازه، برای مسافرها تاریخ دقیق)
    start_time_frame: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    end_time_frame: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    ticket_date_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Package details
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_packed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    price_aed: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="قیمت کل (قدیمی)")
    price_per_kg: Mapped[Optional[float]] = mapped_column(
        Float, 
        nullable=True,
        comment="قیمت به ازای هر کیلوگرم"
    )
    is_legacy_price: Mapped[Optional[bool]] = mapped_column(
        Boolean, 
        nullable=True, 
        default=False,
        comment="True if price is total, not per kg"
    )
    currency: Mapped[Optional[str]] = mapped_column(
        String(3), 
        nullable=True, 
        default="USD",
        comment="واحد پول (ISO 4217)"
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", lazy="select")
    origin_country: Mapped["Country"] = relationship(
        "Country",
        foreign_keys=[origin_country_id],
        lazy="select"
    )
    origin_city: Mapped["City"] = relationship(
        "City",
        foreign_keys=[origin_city_id],
        lazy="select"
    )
    destination_country: Mapped["Country"] = relationship(
        "Country",
        foreign_keys=[destination_country_id],
        lazy="select"
    )
    destination_city: Mapped["City"] = relationship(
        "City",
        foreign_keys=[destination_city_id],
        lazy="select"
    )
    product_classification: Mapped[Optional["ProductClassification"]] = relationship(
        "ProductClassification",
        lazy="select"
    )
    
    # Non-persistent attributes for analytics (computed from card_view table)
    view_count: int = 0
    click_count: int = 0
    
    def __repr__(self) -> str:
        card_type = "sender" if self.is_sender else "traveler"
        return f"<Card(id={self.id}, type={card_type}, owner_id={self.owner_id})>"


class CardCommunity(BaseModel):
    """جدول واسط برای تعلق کارت‌ها به کامیونیتی‌ها."""
    
    __tablename__ = "card_community"
    __table_args__ = (
        UniqueConstraint("card_id", "community_id", name="uq_card_community"),
        Index("ix_card_community_community_id", "community_id"),
    )
    
    # Foreign Keys
    card_id: Mapped[int] = mapped_column(
        ForeignKey("card.id", ondelete="CASCADE"),
        nullable=False,
    )
    community_id: Mapped[int] = mapped_column(
        ForeignKey("community.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Relationships
    card: Mapped["Card"] = relationship("Card", lazy="select")
    community: Mapped["Community"] = relationship("Community", lazy="select")
    
    def __repr__(self) -> str:
        return f"<CardCommunity(card_id={self.card_id}, community_id={self.community_id})>"

