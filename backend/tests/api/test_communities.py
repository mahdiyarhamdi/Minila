"""Tests for community endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_communities_success(client: AsyncClient):
    """Test getting list of communities.
    
    Args:
        client: Test HTTP client
    """
    response = await client.get("/api/v1/communities/")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)

