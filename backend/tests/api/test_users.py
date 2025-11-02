"""Tests for user endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_without_auth(client: AsyncClient):
    """Test getting profile without authentication.
    
    Args:
        client: Test HTTP client
    """
    response = await client.get("/api/v1/users/me")
    
    assert response.status_code == 401

