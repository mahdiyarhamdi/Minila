"""Unit tests for pagination utilities."""
import pytest
from pydantic import BaseModel

from app.utils.pagination import (
    PaginatedResponse,
    get_pagination_params,
    calculate_offset
)


class SampleItem(BaseModel):
    """نمونه مدل برای تست."""
    id: int
    name: str


class TestPaginatedResponse:
    """Tests for PaginatedResponse class."""
    
    def test_create_paginated_response(self):
        """تست ساخت PaginatedResponse."""
        items = [
            SampleItem(id=1, name="Item 1"),
            SampleItem(id=2, name="Item 2")
        ]
        
        response = PaginatedResponse.create(
            items=items,
            total=20,
            page=1,
            page_size=10
        )
        
        assert len(response.items) == 2
        assert response.total == 20
        assert response.page == 1
        assert response.page_size == 10
        assert response.total_pages == 2
    
    def test_total_pages_calculation(self):
        """تست محاسبه تعداد صفحات."""
        items = []
        
        # 25 items, 10 per page = 3 pages
        response = PaginatedResponse.create(
            items=items,
            total=25,
            page=1,
            page_size=10
        )
        assert response.total_pages == 3
        
        # 30 items, 10 per page = 3 pages
        response = PaginatedResponse.create(
            items=items,
            total=30,
            page=1,
            page_size=10
        )
        assert response.total_pages == 3
        
        # 31 items, 10 per page = 4 pages
        response = PaginatedResponse.create(
            items=items,
            total=31,
            page=1,
            page_size=10
        )
        assert response.total_pages == 4
    
    def test_empty_items(self):
        """تست با لیست خالی."""
        response = PaginatedResponse.create(
            items=[],
            total=0,
            page=1,
            page_size=10
        )
        
        assert len(response.items) == 0
        assert response.total == 0
        assert response.total_pages == 0
    
    def test_single_page(self):
        """تست با یک صفحه."""
        items = [SampleItem(id=1, name="Item 1")]
        
        response = PaginatedResponse.create(
            items=items,
            total=5,
            page=1,
            page_size=10
        )
        
        assert response.total_pages == 1
    
    def test_large_page_size(self):
        """تست با page_size بزرگ."""
        items = []
        
        response = PaginatedResponse.create(
            items=items,
            total=50,
            page=1,
            page_size=100
        )
        
        assert response.total_pages == 1


class TestGetPaginationParams:
    """Tests for get_pagination_params function."""
    
    def test_default_params(self):
        """تست پارامترهای پیش‌فرض."""
        page, page_size = get_pagination_params()
        
        assert page == 1
        assert page_size == 20
    
    def test_custom_params(self):
        """تست پارامترهای سفارشی."""
        page, page_size = get_pagination_params(page=2, page_size=50)
        
        assert page == 2
        assert page_size == 50
    
    def test_page_minimum_value(self):
        """تست حداقل مقدار page."""
        page, page_size = get_pagination_params(page=0)
        
        assert page == 1  # Corrected to minimum
    
    def test_page_negative_value(self):
        """تست page منفی."""
        page, page_size = get_pagination_params(page=-5)
        
        assert page == 1  # Corrected to minimum
    
    def test_page_size_minimum_value(self):
        """تست حداقل مقدار page_size."""
        page, page_size = get_pagination_params(page_size=0)
        
        assert page_size == 1  # Corrected to minimum
    
    def test_page_size_maximum_value(self):
        """تست حداکثر مقدار page_size."""
        page, page_size = get_pagination_params(page_size=200)
        
        assert page_size == 100  # Capped at maximum
    
    def test_page_size_negative_value(self):
        """تست page_size منفی."""
        page, page_size = get_pagination_params(page_size=-10)
        
        assert page_size == 1  # Corrected to minimum


class TestCalculateOffset:
    """Tests for calculate_offset function."""
    
    def test_first_page(self):
        """تست صفحه اول."""
        offset = calculate_offset(page=1, page_size=10)
        
        assert offset == 0
    
    def test_second_page(self):
        """تست صفحه دوم."""
        offset = calculate_offset(page=2, page_size=10)
        
        assert offset == 10
    
    def test_third_page(self):
        """تست صفحه سوم."""
        offset = calculate_offset(page=3, page_size=10)
        
        assert offset == 20
    
    def test_large_page_number(self):
        """تست شماره صفحه بزرگ."""
        offset = calculate_offset(page=10, page_size=25)
        
        assert offset == 225  # (10-1) * 25
    
    def test_different_page_sizes(self):
        """تست با page_size های مختلف."""
        assert calculate_offset(page=2, page_size=5) == 5
        assert calculate_offset(page=2, page_size=20) == 20
        assert calculate_offset(page=2, page_size=50) == 50
    
    def test_edge_case_page_1_size_1(self):
        """تست edge case."""
        offset = calculate_offset(page=1, page_size=1)
        
        assert offset == 0

