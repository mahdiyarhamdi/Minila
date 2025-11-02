"""Tests for message endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_message_without_auth(client: AsyncClient):
    """Test sending message without authentication.
    
    Args:
        client: Test HTTP client
    """
    response = await client.post(
        "/api/v1/messages/",
        json={"receiver_id": 2, "body": "Test message"}
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_inbox_without_auth(client: AsyncClient):
    """Test getting inbox without authentication.
    
    Args:
        client: Test HTTP client
    """
    response = await client.get("/api/v1/messages/inbox")
    
    assert response.status_code == 401

