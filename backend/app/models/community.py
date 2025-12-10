"""Community model."""
import re
from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Community(BaseModel):
    """مدل کامیونیتی."""
    
    __tablename__ = "community"
    __table_args__ = (
        Index("ix_community_owner_id", "owner_id"),
        Index("ix_community_slug", "slug"),
    )
    
    # Fields
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    @staticmethod
    def validate_slug(slug: str) -> bool:
        """بررسی فرمت معتبر slug (فقط حروف انگلیسی کوچک، اعداد و آندرلاین)."""
        pattern = r'^[a-z][a-z0-9_]{2,49}$'
        return bool(re.match(pattern, slug))
    
    # Foreign Keys
    avatar_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("avatar.id", ondelete="SET NULL"),
        nullable=True,
    )
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Relationships
    avatar: Mapped[Optional["Avatar"]] = relationship("Avatar", lazy="joined")
    owner: Mapped["User"] = relationship("User", lazy="select")
    
    def __repr__(self) -> str:
        return f"<Community(id={self.id}, name={self.name})>"

