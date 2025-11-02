"""Models package - imports all SQLAlchemy models for Alembic."""

# Base classes
from .base import Base, BaseModel, IntegerIDMixin, TimestampMixin

# Location models
from .location import City, Country

# Avatar and Product models
from .avatar import Avatar
from .product import ProductClassification

# User model
from .user import User

# Role and Access models
from .role import Access, Role, RoleAccess

# Community models
from .community import Community
from .membership import Membership, Request

# Card models
from .card import Card, CardCommunity

# Message model
from .message import Message

# Security models
from .user_block import UserBlock
from .report import Report
from .log import Log


__all__ = [
    # Base
    "Base",
    "BaseModel",
    "IntegerIDMixin",
    "TimestampMixin",
    # Location
    "Country",
    "City",
    # Avatar & Product
    "Avatar",
    "ProductClassification",
    # User
    "User",
    # Role & Access
    "Role",
    "Access",
    "RoleAccess",
    # Community
    "Community",
    "Membership",
    "Request",
    # Card
    "Card",
    "CardCommunity",
    # Message
    "Message",
    # Security
    "UserBlock",
    "Report",
    "Log",
]
