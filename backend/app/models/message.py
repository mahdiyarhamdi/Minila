"""Message model."""
from sqlalchemy import CheckConstraint, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Message(BaseModel):
    """مدل پیام بین کاربران."""
    
    __tablename__ = "message"
    __table_args__ = (
        CheckConstraint("sender_id != receiver_id", name="check_sender_not_receiver"),
        Index("ix_message_receiver_created", "receiver_id", "created_at"),
        Index("ix_message_sender_created", "sender_id", "created_at"),
    )
    
    # Foreign Keys
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Fields
    body: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Relationships
    sender: Mapped["User"] = relationship(
        "User",
        foreign_keys=[sender_id],
        lazy="select"
    )
    receiver: Mapped["User"] = relationship(
        "User",
        foreign_keys=[receiver_id],
        lazy="select"
    )
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, sender_id={self.sender_id}, receiver_id={self.receiver_id})>"

