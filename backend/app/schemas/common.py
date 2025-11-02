"""Common schemas و کلاس‌های پایه برای استفاده در سراسر اپلیکیشن."""
from typing import TypeVar, Generic
from pydantic import BaseModel, Field, ConfigDict


# Type variable برای Generic types
T = TypeVar('T')


class MessageResponse(BaseModel):
    """پاسخ ساده با پیام متنی."""
    
    message: str = Field(..., description="پیام")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "عملیات با موفقیت انجام شد"
            }
        }
    )


class PaginationParams(BaseModel):
    """پارامترهای pagination برای لیست‌ها."""
    
    page: int = Field(default=1, ge=1, description="شماره صفحه (از 1 شروع می‌شود)")
    page_size: int = Field(default=20, ge=1, le=100, description="تعداد آیتم در هر صفحه (حداکثر 100)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "page_size": 20
            }
        }
    )
    
    @property
    def offset(self) -> int:
        """محاسبه offset برای query دیتابیس."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """محاسبه limit برای query دیتابیس."""
        return self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """پاسخ paginated با آیتم‌ها و اطلاعات صفحه‌بندی."""
    
    items: list[T] = Field(..., description="لیست آیتم‌ها در صفحه جاری")
    total: int = Field(..., description="تعداد کل آیتم‌ها")
    page: int = Field(..., description="شماره صفحه جاری")
    page_size: int = Field(..., description="تعداد آیتم در هر صفحه")
    total_pages: int = Field(..., description="تعداد کل صفحات")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5
            }
        }
    )
    
    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """ساخت پاسخ paginated از داده‌ها.
        
        Args:
            items: لیست آیتم‌های صفحه جاری
            total: تعداد کل آیتم‌ها
            page: شماره صفحه جاری
            page_size: تعداد آیتم در هر صفحه
            
        Returns:
            PaginatedResponse با محاسبه خودکار total_pages
        """
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )


class IDResponse(BaseModel):
    """پاسخ ساده با ID رکورد ایجادشده."""
    
    id: int = Field(..., description="شناسه رکورد")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 123
            }
        }
    )


class SuccessResponse(BaseModel):
    """پاسخ موفقیت با پیام و وضعیت."""
    
    success: bool = Field(default=True, description="وضعیت موفقیت")
    message: str = Field(..., description="پیام توضیحی")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "عملیات با موفقیت انجام شد"
            }
        }
    )

