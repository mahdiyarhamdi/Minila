"""UserBlock model for personal blocking between users."""
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class UserBlock(BaseModel):
    """مدل بلاک شخصی کاربر از کاربر دیگر."""
    
    __tablename__ = "user_block"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked"),
        Index("ix_user_block_blocker_id", "blocker_id"),
    )
    
    # Foreign Keys
    blocker_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    blocked_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Relationships
    blocker: Mapped["User"] = relationship(
        "User",
        foreign_keys=[blocker_id],
        lazy="selectinload"
    )
    blocked: Mapped["User"] = relationship(
        "User",
        foreign_keys=[blocked_id],
        lazy="selectinload"
    )
    
    def __repr__(self) -> str:
        return f"<UserBlock(blocker_id={self.blocker_id}, blocked_id={self.blocked_id})>"

