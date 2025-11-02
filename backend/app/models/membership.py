"""Membership and Request models."""
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Membership(BaseModel):
    """مدل عضویت کاربر در کامیونیتی."""
    
    __tablename__ = "membership"
    __table_args__ = (
        UniqueConstraint("user_id", "community_id", name="uq_user_community"),
        Index("ix_membership_community_active", "community_id", "is_active"),
    )
    
    # Foreign Keys
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    community_id: Mapped[int] = mapped_column(
        ForeignKey("community.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("role.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Fields
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectinload")
    community: Mapped["Community"] = relationship("Community", lazy="selectinload")
    role: Mapped["Role"] = relationship("Role", lazy="selectinload")
    
    def __repr__(self) -> str:
        return f"<Membership(user_id={self.user_id}, community_id={self.community_id})>"


class Request(BaseModel):
    """مدل درخواست عضویت در کامیونیتی."""
    
    __tablename__ = "request"
    __table_args__ = (
        UniqueConstraint("user_id", "community_id", name="uq_request_user_community"),
        Index("ix_request_community_status", "community_id", "is_approved", "created_at"),
    )
    
    # Foreign Keys
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    community_id: Mapped[int] = mapped_column(
        ForeignKey("community.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Fields
    # NULL = pending, True = approved, False = rejected
    is_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=None)
    
    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectinload")
    community: Mapped["Community"] = relationship("Community", lazy="selectinload")
    
    def __repr__(self) -> str:
        status = "pending" if self.is_approved is None else ("approved" if self.is_approved else "rejected")
        return f"<Request(user_id={self.user_id}, community_id={self.community_id}, status={status})>"

