"""User model."""
from typing import Optional
from datetime import date
from sqlalchemy import Boolean, Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class User(BaseModel):
    """مدل کاربر."""
    
    __tablename__ = "user"
    __table_args__ = (
        Index("ix_user_email", "email", unique=True),
        Index("ix_user_created_at", "created_at"),
    )
    
    # Basic fields
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Authentication (خام - باید hash شود در آینده)
    password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    otp_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Personal info
    national_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    birthday: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Foreign Keys
    avatar_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("avatar.id", ondelete="SET NULL"),
        nullable=True,
    )
    country_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("country.id", ondelete="RESTRICT"),
        nullable=True,
    )
    city_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("city.id", ondelete="RESTRICT"),
        nullable=True,
    )
    
    # Relationships
    avatar: Mapped[Optional["Avatar"]] = relationship("Avatar", lazy="joined")
    country: Mapped[Optional["Country"]] = relationship("Country", lazy="selectinload")
    city: Mapped[Optional["City"]] = relationship("City", lazy="selectinload")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"

