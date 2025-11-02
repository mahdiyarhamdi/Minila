"""Membership و Request schemas برای مدیریت عضویت در کامیونیتی‌ها."""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from .user import UserBasicOut
from .community import CommunityBasicOut


# ========== Role Schema ==========

class RoleOut(BaseModel):
    """خروجی Role."""
    
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)


# ========== Membership Schemas ==========

class MembershipOut(BaseModel):
    """خروجی Membership با اطلاعات user، community و role."""
    
    id: int
    user: UserBasicOut
    community: CommunityBasicOut
    role: RoleOut
    is_active: bool
    created_at: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "user": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "community": {"id": 1, "name": "کامیونیتی مسافران تهران", "bio": "توضیحات"},
                "role": {"id": 1, "name": "member"},
                "is_active": True,
                "created_at": "2024-01-01T12:00:00"
            }
        }
    )


class MembershipUpdateRole(BaseModel):
    """تغییر نقش عضو در کامیونیتی."""
    
    role_id: int = Field(..., description="شناسه نقش جدید")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "role_id": 2
            }
        }
    )


# ========== Request Schemas ==========

class RequestCreate(BaseModel):
    """ایجاد درخواست عضویت در کامیونیتی."""
    
    community_id: int = Field(..., description="شناسه کامیونیتی")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "community_id": 1
            }
        }
    )


class RequestOut(BaseModel):
    """خروجی Request با اطلاعات user و community."""
    
    id: int
    user: UserBasicOut
    community: CommunityBasicOut
    is_approved: Optional[bool] = Field(None, description="وضعیت تأیید: null=pending, true=approved, false=rejected")
    created_at: str
    updated_at: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "user": {"id": 1, "first_name": "علی", "last_name": "احمدی"},
                "community": {"id": 1, "name": "کامیونیتی مسافران تهران", "bio": "توضیحات"},
                "is_approved": None,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


class RequestApproveRejectIn(BaseModel):
    """تأیید یا رد درخواست عضویت."""
    
    is_approved: bool = Field(..., description="true=تأیید، false=رد")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_approved": True
            }
        }
    )

