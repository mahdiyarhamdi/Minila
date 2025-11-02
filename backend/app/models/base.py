"""Base models for SQLAlchemy with common fields."""
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Base class برای تمام مدل‌های SQLAlchemy."""
    pass


class TimestampMixin:
    """Mixin برای فیلدهای timestamp خودکار."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class IntegerIDMixin:
    """Mixin برای primary key با Integer autoincrement."""
    
    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        nullable=False,
    )


class BaseModel(Base, IntegerIDMixin, TimestampMixin):
    """Base model با id، created_at و updated_at."""
    
    __abstract__ = True
    
    def __repr__(self) -> str:
        """نمایش خوانا برای debug."""
        return f"<{self.__class__.__name__}(id={self.id})>"

