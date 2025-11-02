"""Log model for system events."""
from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Log(BaseModel):
    """مدل لاگ برای ثبت رویدادهای سیستمی."""
    
    __tablename__ = "log"
    __table_args__ = (
        Index("ix_log_event_created", "event_type", "created_at"),
        Index("ix_log_actor_created", "actor_user_id", "created_at"),
    )
    
    # Fields
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="نوع رویداد: signup, login, join_request, card_create, message_send, ban, unban"
    )
    
    # Optional metadata
    ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Foreign Keys (همه اختیاری)
    actor_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    card_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("card.id", ondelete="SET NULL"),
        nullable=True,
    )
    community_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("community.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    actor: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[actor_user_id],
        lazy="selectinload"
    )
    target_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[target_user_id],
        lazy="selectinload"
    )
    card: Mapped[Optional["Card"]] = relationship("Card", lazy="selectinload")
    community: Mapped[Optional["Community"]] = relationship("Community", lazy="selectinload")
    
    def __repr__(self) -> str:
        return f"<Log(id={self.id}, event_type={self.event_type}, actor_id={self.actor_user_id})>"

