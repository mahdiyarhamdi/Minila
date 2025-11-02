"""Tests for authentication endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient, test_user_data: dict):
    """Test successful user signup.
    
    Args:
        client: Test HTTP client
        test_user_data: Sample user data
    """
    response = await client.post("/api/v1/auth/signup", json=test_user_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["first_name"] == test_user_data["first_name"]
    assert data["last_name"] == test_user_data["last_name"]
    assert "id" in data
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient, test_user_data: dict):
    """Test signup with duplicate email.
    
    Args:
        client: Test HTTP client
        test_user_data: Sample user data
    """
    # First signup
    await client.post("/api/v1/auth/signup", json=test_user_data)
    
    # Second signup with same email
    response = await client.post("/api/v1/auth/signup", json=test_user_data)
    
    assert response.status_code == 400
    assert "تکراری" in response.json()["detail"]


@pytest.mark.asyncio
async def test_request_otp_success(client: AsyncClient, test_user_data: dict):
    """Test OTP request for existing user.
    
    Args:
        client: Test HTTP client
        test_user_data: Sample user data
    """
    # Signup first
    await client.post("/api/v1/auth/signup", json=test_user_data)
    
    # Request OTP
    response = await client.post(
        "/api/v1/auth/request-otp",
        json={"email": test_user_data["email"]}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["email"] == test_user_data["email"]


@pytest.mark.asyncio
async def test_request_otp_nonexistent_user(client: AsyncClient):
    """Test OTP request for non-existent user.
    
    Args:
        client: Test HTTP client
    """
    response = await client.post(
        "/api/v1/auth/request-otp",
        json={"email": "nonexistent@example.com"}
    )
    
    assert response.status_code == 400

