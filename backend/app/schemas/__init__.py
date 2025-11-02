"""Pydantic schemas for API validation and serialization."""

# Common schemas
from .common import (
    MessageResponse,
    PaginationParams,
    PaginatedResponse,
    IDResponse,
    SuccessResponse,
)

# Auth schemas
from .auth import (
    AuthRequestOTPIn,
    AuthVerifyOTPIn,
    AuthTokenOut,
    AuthRefreshIn,
    AuthSignupIn,
)

# User schemas
from .user import (
    AvatarOut,
    CountryOut,
    CityOut,
    UserBase,
    UserCreate,
    UserUpdate,
    UserOut,
    UserMeOut,
    UserBasicOut,
)

# Community schemas
from .community import (
    CommunityCreate,
    CommunityUpdate,
    CommunityOut,
    CommunityBasicOut,
    CommunityDetailOut,
)

# Membership schemas
from .membership import (
    RoleOut,
    MembershipOut,
    MembershipUpdateRole,
    RequestCreate,
    RequestOut,
    RequestApproveRejectIn,
)

# Card schemas
from .card import (
    ProductClassificationOut,
    CardCreate,
    CardUpdate,
    CardFilter,
    CardOut,
    CardDetailOut,
)

# Message schemas
from .message import (
    MessageCreate,
    MessageOut,
)

# Report schemas
from .report import (
    ReportCreate,
    ReportOut,
)

# Log schemas
from .log import (
    LogOut,
    LogEventType,
)


__all__ = [
    # Common
    "MessageResponse",
    "PaginationParams",
    "PaginatedResponse",
    "IDResponse",
    "SuccessResponse",
    
    # Auth
    "AuthRequestOTPIn",
    "AuthVerifyOTPIn",
    "AuthTokenOut",
    "AuthRefreshIn",
    "AuthSignupIn",
    
    # User
    "AvatarOut",
    "CountryOut",
    "CityOut",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "UserMeOut",
    "UserBasicOut",
    
    # Community
    "CommunityCreate",
    "CommunityUpdate",
    "CommunityOut",
    "CommunityBasicOut",
    "CommunityDetailOut",
    
    # Membership
    "RoleOut",
    "MembershipOut",
    "MembershipUpdateRole",
    "RequestCreate",
    "RequestOut",
    "RequestApproveRejectIn",
    
    # Card
    "ProductClassificationOut",
    "CardCreate",
    "CardUpdate",
    "CardFilter",
    "CardOut",
    "CardDetailOut",
    
    # Message
    "MessageCreate",
    "MessageOut",
    
    # Report
    "ReportCreate",
    "ReportOut",
    
    # Log
    "LogOut",
    "LogEventType",
]
