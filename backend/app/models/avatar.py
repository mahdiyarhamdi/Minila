"""Avatar model for user and community profile pictures."""
from typing import Optional
from sqlalchemy import Index, String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from .base import BaseModel


class Avatar(BaseModel):
    """مدل آواتار برای تصاویر پروفایل کاربران و کامیونیتی‌ها."""
    
    __tablename__ = "avatar"
    __table_args__ = (
        Index("ix_avatar_created_at", "created_at"),
    )
    
    # Fields
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Avatar(id={self.id}, mime_type={self.mime_type})>"

