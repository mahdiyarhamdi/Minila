"""Tests for card endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_cards_success(client: AsyncClient):
    """Test getting list of cards.
    
    Args:
        client: Test HTTP client
    """
    response = await client.get("/api/v1/cards/")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_get_cards_with_filters(client: AsyncClient):
    """Test getting cards with filters.
    
    Args:
        client: Test HTTP client
    """
    response = await client.get(
        "/api/v1/cards/",
        params={
            "is_sender": False,
            "page": 1,
            "page_size": 10
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data

