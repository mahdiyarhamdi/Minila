"""Comprehensive tests for authentication endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta


# ==================== POST /api/v1/auth/signup ====================

class TestSignup:
    """Test cases for user signup endpoint."""

    @pytest.mark.asyncio
    async def test_signup_success(self, client: AsyncClient):
        """Test successful user signup with all required fields."""
        # Arrange
        payload = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User"
        }
        
        # Act
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        # Debug: print response if not 201
        if response.status_code != 201:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == payload["last_name"]
        assert "id" in data
        assert data["is_active"] is True
        assert "password" not in data  # Password should not be returned

    @pytest.mark.asyncio
    async def test_signup_duplicate_email(self, client: AsyncClient, test_user: dict):
        """Test signup with duplicate email returns 400."""
        # Arrange
        payload = {
            "email": test_user["email"],
            "password": "AnotherPass123!",
            "first_name": "Duplicate",
            "last_name": "User"
        }
        
        # Act
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        # Assert
        assert response.status_code == 400
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_signup_invalid_email(self, client: AsyncClient):
        """Test signup with invalid email format returns 422."""
        # Arrange
        payload = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        # Act
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_missing_required_field(self, client: AsyncClient):
        """Test signup with missing email field returns 422."""
        # Arrange
        payload = {
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        # Act
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_signup_empty_password(self, client: AsyncClient):
        """Test signup with empty password returns 422."""
        # Arrange
        payload = {
            "email": "test@example.com",
            "password": "",
            "first_name": "Test",
            "last_name": "User"
        }
        
        # Act
        response = await client.post("/api/v1/auth/signup", json=payload)
        
        # Assert
        assert response.status_code == 422


# ==================== POST /api/v1/auth/request-otp ====================

class TestRequestOTP:
    """Test cases for OTP request endpoint."""

    @pytest.mark.asyncio
    async def test_request_otp_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_db: AsyncSession
    ):
        """Test successful OTP request for existing user."""
        # Arrange
        payload = {"email": test_user["email"]}
        
        # Act
        response = await client.post("/api/v1/auth/request-otp", json=payload)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["email"] == test_user["email"]
        
        # Verify OTP was saved in database
        from app.models.user import User
        from sqlalchemy import select
        result = await test_db.execute(
            select(User).where(User.email == test_user["email"])
        )
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.otp_code is not None

    @pytest.mark.asyncio
    async def test_request_otp_nonexistent_user(self, client: AsyncClient):
        """Test OTP request for non-existent user returns 400."""
        # Arrange
        payload = {"email": "nonexistent@example.com"}
        
        # Act
        response = await client.post("/api/v1/auth/request-otp", json=payload)
        
        # Assert
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_request_otp_invalid_email(self, client: AsyncClient):
        """Test OTP request with invalid email format returns 422."""
        # Arrange
        payload = {"email": "not-an-email"}
        
        # Act
        response = await client.post("/api/v1/auth/request-otp", json=payload)
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_request_otp_updates_existing_code(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_db: AsyncSession
    ):
        """Test that requesting OTP again updates the existing code."""
        # Arrange
        payload = {"email": test_user["email"]}
        
        # Act - First request
        response1 = await client.post("/api/v1/auth/request-otp", json=payload)
        assert response1.status_code == 200
        
        # Get first OTP
        from app.models.user import User
        from sqlalchemy import select
        result = await test_db.execute(
            select(User).where(User.email == test_user["email"])
        )
        user = result.scalar_one()
        first_otp = user.otp_code
        
        # Act - Second request
        response2 = await client.post("/api/v1/auth/request-otp", json=payload)
        assert response2.status_code == 200
        
        # Get second OTP
        await test_db.refresh(user)
        second_otp = user.otp_code
        
        # Assert - OTP should be updated
        assert first_otp != second_otp


# ==================== POST /api/v1/auth/verify-otp ====================

class TestVerifyOTP:
    """Test cases for OTP verification endpoint."""

    @pytest.mark.asyncio
    async def test_verify_otp_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_db: AsyncSession
    ):
        """Test successful OTP verification returns tokens."""
        # Arrange - Request OTP first
        await client.post("/api/v1/auth/request-otp", json={"email": test_user["email"]})
        
        # Get the OTP from database
        from app.models.user import User
        from sqlalchemy import select
        result = await test_db.execute(
            select(User).where(User.email == test_user["email"])
        )
        user = result.scalar_one()
        otp_code = user.otp_code
        
        payload = {
            "email": test_user["email"],
            "otp_code": otp_code
        }
        
        # Act
        response = await client.post("/api/v1/auth/verify-otp", json=payload)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        
        # Verify OTP was cleared (single-use)
        await test_db.refresh(user)
        assert user.otp_code is None

    @pytest.mark.asyncio
    async def test_verify_otp_wrong_code(
        self, 
        client: AsyncClient, 
        test_user: dict
    ):
        """Test OTP verification with wrong code returns 401."""
        # Arrange - Request OTP first
        await client.post("/api/v1/auth/request-otp", json={"email": test_user["email"]})
        
        payload = {
            "email": test_user["email"],
            "otp_code": "000000"  # Wrong code
        }
        
        # Act
        response = await client.post("/api/v1/auth/verify-otp", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_otp_used_code(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_db: AsyncSession
    ):
        """Test that OTP can only be used once (single-use)."""
        # Arrange - Request OTP and get code
        await client.post("/api/v1/auth/request-otp", json={"email": test_user["email"]})
        
        from app.models.user import User
        from sqlalchemy import select
        result = await test_db.execute(
            select(User).where(User.email == test_user["email"])
        )
        user = result.scalar_one()
        otp_code = user.otp_code
        
        payload = {
            "email": test_user["email"],
            "otp_code": otp_code
        }
        
        # Act - First verification (should succeed)
        response1 = await client.post("/api/v1/auth/verify-otp", json=payload)
        assert response1.status_code == 200
        
        # Act - Second verification with same code (should fail)
        response2 = await client.post("/api/v1/auth/verify-otp", json=payload)
        
        # Assert
        assert response2.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_otp_nonexistent_user(self, client: AsyncClient):
        """Test OTP verification for non-existent user returns 401."""
        # Arrange
        payload = {
            "email": "nonexistent@example.com",
            "otp_code": "123456"
        }
        
        # Act
        response = await client.post("/api/v1/auth/verify-otp", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_otp_invalid_email_format(self, client: AsyncClient):
        """Test OTP verification with invalid email format returns 422."""
        # Arrange
        payload = {
            "email": "not-an-email",
            "otp_code": "123456"
        }
        
        # Act
        response = await client.post("/api/v1/auth/verify-otp", json=payload)
        
        # Assert
        assert response.status_code == 422


# ==================== POST /api/v1/auth/refresh ====================

class TestRefreshToken:
    """Test cases for token refresh endpoint."""

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_db: AsyncSession
    ):
        """Test successful token refresh with valid refresh token."""
        # Arrange - Get tokens by verifying OTP
        await client.post("/api/v1/auth/request-otp", json={"email": test_user["email"]})
        
        from app.models.user import User
        from sqlalchemy import select
        result = await test_db.execute(
            select(User).where(User.email == test_user["email"])
        )
        user = result.scalar_one()
        otp_code = user.otp_code
        
        verify_response = await client.post(
            "/api/v1/auth/verify-otp",
            json={"email": test_user["email"], "otp_code": otp_code}
        )
        tokens = verify_response.json()
        refresh_token = tokens["refresh_token"]
        
        payload = {"refresh_token": refresh_token}
        
        # Act
        response = await client.post("/api/v1/auth/refresh", json=payload)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test token refresh with invalid refresh token returns 401."""
        # Arrange
        payload = {"refresh_token": "invalid.token.here"}
        
        # Act
        response = await client.post("/api/v1/auth/refresh", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_expired(self, client: AsyncClient):
        """Test token refresh with expired token returns 401."""
        # Arrange - Create an expired token
        from app.core.security import create_refresh_token
        from app.core.config import get_settings
        
        settings = get_settings()
        
        # Create token that expired 1 minute ago
        expired_token = create_refresh_token(
            {"user_id": 999, "email": "test@example.com"},
            settings.SECRET_KEY,
            expires_minutes=-1  # Negative means already expired
        )
        
        payload = {"refresh_token": expired_token}
        
        # Act
        response = await client.post("/api/v1/auth/refresh", json=payload)
        
        # Assert
        assert response.status_code == 401
