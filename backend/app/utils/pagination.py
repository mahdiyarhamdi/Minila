"""Pagination utilities."""
from typing import TypeVar, Generic, Sequence
from pydantic import BaseModel, Field

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """پاسخ صفحه‌بندی شده برای لیست‌ها.
    
    Generic type که می‌تواند برای هر نوع داده‌ای استفاده شود.
    """
    items: Sequence[T] = Field(..., description="لیست آیتم‌های صفحه جاری")
    total: int = Field(..., description="تعداد کل آیتم‌ها")
    page: int = Field(..., description="شماره صفحه جاری (از 1 شروع)")
    page_size: int = Field(..., description="تعداد آیتم‌ها در هر صفحه")
    total_pages: int = Field(..., description="تعداد کل صفحات")
    
    @classmethod
    def create(
        cls,
        items: Sequence[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """ساخت پاسخ paginated.
        
        Args:
            items: لیست آیتم‌های صفحه جاری
            total: تعداد کل آیتم‌ها
            page: شماره صفحه جاری
            page_size: تعداد آیتم در هر صفحه
            
        Returns:
            PaginatedResponse با اطلاعات کامل
        """
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )


def get_pagination_params(
    page: int = 1,
    page_size: int = 20
) -> tuple[int, int]:
    """Dependency برای دریافت پارامترهای pagination.
    
    Args:
        page: شماره صفحه (پیش‌فرض: 1)
        page_size: تعداد آیتم در صفحه (پیش‌فرض: 20، حداکثر: 100)
        
    Returns:
        tuple از (page, page_size) اعتبارسنجی شده
    """
    # اعتبارسنجی
    page = max(1, page)
    page_size = max(1, min(100, page_size))
    
    return page, page_size


def calculate_offset(page: int, page_size: int) -> int:
    """محاسبه offset برای کوئری دیتابیس.
    
    Args:
        page: شماره صفحه (از 1 شروع)
        page_size: تعداد آیتم در صفحه
        
    Returns:
        offset برای LIMIT/OFFSET query
    """
    return (page - 1) * page_size

