"""Report model for user reports."""
from typing import Optional
from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Report(BaseModel):
    """مدل گزارش (Report) کاربر از کاربر یا کارت."""
    
    __tablename__ = "report"
    __table_args__ = (
        Index("ix_report_card_created", "card_id", "created_at"),
        Index("ix_report_reporter_created", "reporter_id", "created_at"),
    )
    
    # Foreign Keys
    reporter_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    reported_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    card_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("card.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Fields
    body: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Relationships
    reporter: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reporter_id],
        lazy="selectinload"
    )
    reported: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reported_id],
        lazy="selectinload"
    )
    card: Mapped[Optional["Card"]] = relationship("Card", lazy="selectinload")
    
    def __repr__(self) -> str:
        return f"<Report(id={self.id}, reporter_id={self.reporter_id}, reported_id={self.reported_id})>"

