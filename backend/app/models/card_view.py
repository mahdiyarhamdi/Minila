"""CardView model for tracking card impressions and clicks."""
from typing import Optional
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class CardView(BaseModel):
    """Model for tracking card views (impressions) and clicks."""
    
    __tablename__ = "card_view"
    __table_args__ = (
        Index("ix_card_view_card_id", "card_id"),
        Index("ix_card_view_user_id", "user_id"),
        Index("ix_card_view_view_type", "view_type"),
        Index("ix_card_view_created_at", "created_at"),
    )
    
    # Foreign Keys
    card_id: Mapped[int] = mapped_column(
        ForeignKey("card.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # View type: 'impression' = card appeared in list, 'click' = user clicked on card
    view_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="View type: 'impression' or 'click'"
    )
    
    # Optional tracking data
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 can be up to 45 chars
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Relationships
    card: Mapped["Card"] = relationship("Card", lazy="select")
    user: Mapped[Optional["User"]] = relationship("User", lazy="select")
    
    def __repr__(self) -> str:
        return f"<CardView(card_id={self.card_id}, type={self.view_type}, user_id={self.user_id})>"

