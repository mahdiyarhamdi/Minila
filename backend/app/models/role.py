"""Role and Access models for permission management."""
from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModel


class Role(BaseModel):
    """مدل نقش (Role) - مثلاً member، manager، owner."""
    
    __tablename__ = "role"
    
    # Fields
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Relationships
    accesses: Mapped[list["RoleAccess"]] = relationship(
        "RoleAccess",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name})>"


class Access(BaseModel):
    """مدل سطح دسترسی (Access) - مثلاً read، write، delete."""
    
    __tablename__ = "access"
    
    # Fields
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Relationships
    roles: Mapped[list["RoleAccess"]] = relationship(
        "RoleAccess",
        back_populates="access",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Access(id={self.id}, name={self.name})>"


class RoleAccess(BaseModel):
    """جدول واسط برای ارتباط Role و Access."""
    
    __tablename__ = "role_access"
    __table_args__ = (
        UniqueConstraint("role_id", "access_id", name="uq_role_access"),
        Index("ix_role_access_role_id", "role_id"),
        Index("ix_role_access_access_id", "access_id"),
    )
    
    # Foreign Keys
    role_id: Mapped[int] = mapped_column(
        ForeignKey("role.id", ondelete="CASCADE"),
        nullable=False,
    )
    access_id: Mapped[int] = mapped_column(
        ForeignKey("access.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="accesses")
    access: Mapped["Access"] = relationship("Access", back_populates="roles")
    
    def __repr__(self) -> str:
        return f"<RoleAccess(role_id={self.role_id}, access_id={self.access_id})>"

