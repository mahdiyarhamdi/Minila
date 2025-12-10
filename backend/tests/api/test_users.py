"""Comprehensive tests for user management endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ==================== GET /api/v1/users/me ====================

class TestGetMyProfile:
    """Test cases for getting current user profile."""

    @pytest.mark.asyncio
    async def test_get_profile_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test successful profile retrieval with valid token."""
        # Act
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user["email"]
        assert data["first_name"] == test_user["first_name"]
        assert data["last_name"] == test_user["last_name"]
        assert "id" in data
        assert data["is_active"] is True
        assert "password" not in data  # Password should never be returned

    @pytest.mark.asyncio
    async def test_get_profile_without_auth(self, client: AsyncClient):
        """Test profile retrieval without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/users/me")
        
        # Assert
        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_get_profile_invalid_token(self, client: AsyncClient):
        """Test profile retrieval with invalid token returns 401."""
        # Arrange
        headers = {"Authorization": "Bearer invalid.token.here"}
        
        # Act
        response = await client.get("/api/v1/users/me", headers=headers)
        
        # Assert
        assert response.status_code == 401


# ==================== PATCH /api/v1/users/me ====================

class TestUpdateMyProfile:
    """Test cases for updating current user profile."""

    @pytest.mark.asyncio
    async def test_update_profile_all_fields(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession
    ):
        """Test successful profile update with all fields."""
        # Arrange
        payload = {
            "first_name": "Updated",
            "last_name": "Name",
            "national_id": "1234567890",
            "gender": "male",
            "postal_code": "12345"
        }
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == payload["last_name"]
        assert data["national_id"] == payload["national_id"]
        assert data["gender"] == payload["gender"]
        assert data["postal_code"] == payload["postal_code"]
        assert data["email"] == test_user["email"]  # Email should not change

    @pytest.mark.asyncio
    async def test_update_profile_partial(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test partial profile update (only first_name)."""
        # Arrange
        payload = {"first_name": "PartialUpdate"}
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == test_user["last_name"]  # Should remain unchanged
        assert data["email"] == test_user["email"]  # Should remain unchanged

    @pytest.mark.asyncio
    async def test_update_profile_without_auth(self, client: AsyncClient):
        """Test profile update without authentication returns 401."""
        # Arrange
        payload = {"first_name": "Unauthorized"}
        
        # Act
        response = await client.patch("/api/v1/users/me", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_profile_invalid_data(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test profile update with invalid data type returns 422."""
        # Arrange
        payload = {"postal_code": 12345}  # Should be string, not int
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_profile_check_updated_at(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession
    ):
        """Test that updated_at timestamp is properly updated."""
        # Arrange
        from app.models.user import User
        from sqlalchemy import select
        
        # Get original updated_at
        result = await test_db.execute(
            select(User).where(User.id == test_user["user_id"])
        )
        user_before = result.scalar_one()
        updated_at_before = user_before.updated_at
        
        payload = {"first_name": "UpdatedTimestamp"}
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        
        # Verify updated_at changed
        await test_db.refresh(user_before)
        updated_at_after = user_before.updated_at
        assert updated_at_after > updated_at_before

    @pytest.mark.asyncio
    async def test_update_profile_empty_payload(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test profile update with empty payload (no changes)."""
        # Arrange
        payload = {}
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # All fields should remain unchanged
        assert data["email"] == test_user["email"]
        assert data["first_name"] == test_user["first_name"]
        assert data["last_name"] == test_user["last_name"]

    @pytest.mark.asyncio
    async def test_update_profile_with_null_values(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test profile update with null values for optional fields."""
        # Arrange
        payload = {
            "national_id": None,
            "gender": None
        }
        
        # Act
        response = await client.patch(
            "/api/v1/users/me", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # Null values should be accepted for optional fields
        assert data["national_id"] is None
        assert data["gender"] is None


# ==================== PUT /api/v1/users/me/password ====================

class TestChangePassword:
    """Test cases for changing user password."""

    @pytest.mark.asyncio
    async def test_change_password_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession
    ):
        """Test successful password change with valid credentials."""
        # Arrange
        payload = {
            "old_password": test_user["password"],
            "new_password": "NewSecurePass123!"
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "موفقیت" in data["message"]
        
        # Verify user can login with new password
        login_payload = {
            "email": test_user["email"],
            "password": "NewSecurePass123!"
        }
        login_response = await client.post(
            "/api/v1/auth/login-password",
            json=login_payload
        )
        assert login_response.status_code == 200

    @pytest.mark.asyncio
    async def test_change_password_wrong_old_password(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test password change with incorrect old password returns 400."""
        # Arrange
        payload = {
            "old_password": "WrongPassword123!",
            "new_password": "NewSecurePass123!"
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 400
        assert "نادرست" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_change_password_without_auth(self, client: AsyncClient):
        """Test password change without authentication returns 401."""
        # Arrange
        payload = {
            "old_password": "OldPass123!",
            "new_password": "NewPass123!"
        }
        
        # Act
        response = await client.put("/api/v1/users/me/password", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_too_short(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test password change with too short new password returns 422."""
        # Arrange
        payload = {
            "old_password": test_user["password"],
            "new_password": "Short1!"  # Less than 8 characters
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_missing_fields(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test password change with missing fields returns 422."""
        # Arrange - Missing new_password
        payload = {
            "old_password": "OldPass123!"
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_empty_strings(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test password change with empty strings returns 422."""
        # Arrange
        payload = {
            "old_password": "",
            "new_password": ""
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_logs_event(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession
    ):
        """Test that password change creates a log entry."""
        # Arrange
        from app.models.log import Log
        from sqlalchemy import select, func
        
        # Count logs before
        result = await test_db.execute(
            select(func.count(Log.id)).where(
                Log.event_type == "password_changed",
                Log.actor_user_id == test_user["user_id"]
            )
        )
        logs_before = result.scalar()
        
        payload = {
            "old_password": test_user["password"],
            "new_password": "NewSecurePass123!"
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        
        # Verify log was created
        result = await test_db.execute(
            select(func.count(Log.id)).where(
                Log.event_type == "password_changed",
                Log.actor_user_id == test_user["user_id"]
            )
        )
        logs_after = result.scalar()
        assert logs_after == logs_before + 1

    @pytest.mark.asyncio
    async def test_change_password_old_password_no_longer_works(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test that old password no longer works after change."""
        # Arrange
        payload = {
            "old_password": test_user["password"],
            "new_password": "NewSecurePass123!"
        }
        
        # Act - Change password
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Try to login with old password
        login_payload = {
            "email": test_user["email"],
            "password": test_user["password"]  # Old password
        }
        login_response = await client.post(
            "/api/v1/auth/login-password",
            json=login_payload
        )
        
        # Assert - Old password should not work
        assert login_response.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_with_special_characters(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test password change with special characters in password."""
        # Arrange
        payload = {
            "old_password": test_user["password"],
            "new_password": "P@ssw0rd!#$%^&*()"
        }
        
        # Act
        response = await client.put(
            "/api/v1/users/me/password", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        
        # Verify login with new password containing special chars
        login_payload = {
            "email": test_user["email"],
            "password": "P@ssw0rd!#$%^&*()"
        }
        login_response = await client.post(
            "/api/v1/auth/login-password",
            json=login_payload
        )
        assert login_response.status_code == 200


# ==================== GET /api/v1/users/me/join-requests ====================

class TestGetMyJoinRequests:
    """Test cases for getting current user's join requests."""

    @pytest.mark.asyncio
    async def test_get_join_requests_success(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        test_community: dict,
        auth_headers_user2: dict,
        test_db: AsyncSession
    ):
        """Test successful retrieval of join requests with data."""
        # Arrange - Create a join request
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join",
            headers=auth_headers_user2
        )
        assert join_response.status_code == 201
        
        # Act
        response = await client.get(
            "/api/v1/users/me/join-requests",
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure of request
        request_item = data[0]
        assert "id" in request_item
        assert "user" in request_item
        assert "community" in request_item
        assert "is_approved" in request_item
        assert "status" in request_item
        assert "created_at" in request_item
        assert request_item["user"]["id"] == test_user2["user_id"]

    @pytest.mark.asyncio
    async def test_get_join_requests_empty(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test retrieval of join requests when user has no requests."""
        # Act - User has no join requests
        response = await client.get(
            "/api/v1/users/me/join-requests",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # May have 0 or more requests depending on fixtures

    @pytest.mark.asyncio
    async def test_get_join_requests_without_auth(self, client: AsyncClient):
        """Test getting join requests without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/users/me/join-requests")
        
        # Assert
        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_get_join_requests_includes_all_statuses(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        test_community: dict,
        test_community2: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_db: AsyncSession
    ):
        """Test that all request statuses (pending, approved, rejected) are returned."""
        # Arrange - Create multiple requests with different statuses
        
        # 1. Create pending request
        pending_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join",
            headers=auth_headers_user2
        )
        assert pending_response.status_code == 201
        pending_request_id = pending_response.json()["id"]
        
        # 2. Create and approve another request
        approved_response = await client.post(
            f"/api/v1/communities/{test_community2['id']}/join",
            headers=auth_headers_user2
        )
        assert approved_response.status_code == 201
        approved_request_id = approved_response.json()["id"]
        
        # Approve the second request (as owner of community2)
        await client.post(
            f"/api/v1/communities/{test_community2['id']}/requests/{approved_request_id}/approve",
            headers=auth_headers  # test_user is owner of community2
        )
        
        # Act - Get all join requests
        response = await client.get(
            "/api/v1/users/me/join-requests",
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        
        # Verify both pending and approved requests are included
        statuses = [req["status"] for req in data]
        assert "pending" in statuses
        assert "approved" in statuses

    @pytest.mark.asyncio
    async def test_get_join_requests_ordered_newest_first(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        test_community: dict,
        test_community2: dict,
        auth_headers_user2: dict,
        test_db: AsyncSession
    ):
        """Test that join requests are ordered by newest first."""
        # Arrange - Create multiple requests
        await client.post(
            f"/api/v1/communities/{test_community['id']}/join",
            headers=auth_headers_user2
        )
        
        await client.post(
            f"/api/v1/communities/{test_community2['id']}/join",
            headers=auth_headers_user2
        )
        
        # Act
        response = await client.get(
            "/api/v1/users/me/join-requests",
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if len(data) >= 2:
            # Verify ordering (newest first)
            timestamps = [req["created_at"] for req in data]
            assert timestamps == sorted(timestamps, reverse=True)

    @pytest.mark.asyncio
    async def test_get_join_requests_includes_community_details(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        test_community: dict,
        auth_headers_user2: dict
    ):
        """Test that join requests include full community details."""
        # Arrange
        await client.post(
            f"/api/v1/communities/{test_community['id']}/join",
            headers=auth_headers_user2
        )
        
        # Act
        response = await client.get(
            "/api/v1/users/me/join-requests",
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        
        # Verify community details are included
        request_item = data[0]
        community = request_item["community"]
        assert "id" in community
        assert "name" in community
        assert community["name"] == test_community["name"]


# ==================== GET /api/v1/users/me/managed-requests ====================

class TestGetManagedRequests:
    """Test cases for getting join requests for communities user manages."""

    @pytest.mark.asyncio
    async def test_get_managed_requests_as_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict
    ):
        """Test owner can see join requests for their community."""
        # Arrange - Create a join request from user2 to community owned by test_user
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join",
            headers=auth_headers_user2
        )
        assert join_response.status_code == 201
        
        # Act - Get managed requests as owner
        response = await client.get(
            "/api/v1/users/me/managed-requests",
            headers=auth_headers  # test_user is owner
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure
        request_item = data[0]
        assert "id" in request_item
        assert "user" in request_item
        assert "community" in request_item
        assert request_item["user"]["id"] == test_user2["user_id"]
        assert request_item["community"]["id"] == test_community["id"]

    @pytest.mark.asyncio
    async def test_get_managed_requests_empty_for_non_manager(
        self, 
        client: AsyncClient, 
        auth_headers_user2: dict
    ):
        """Test user with no managed communities gets empty list."""
        # Act
        response = await client.get(
            "/api/v1/users/me/managed-requests",
            headers=auth_headers_user2  # user2 doesn't own any community
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_managed_requests_without_auth(self, client: AsyncClient):
        """Test getting managed requests without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/users/me/managed-requests")
        
        # Assert
        assert response.status_code == 401


# ==================== Block/Unblock Users ====================

class TestBlockUser:
    """Test cases for blocking and unblocking users."""

    @pytest.mark.asyncio
    async def test_block_user_success(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        auth_headers: dict
    ):
        """Test successful user blocking."""
        # Act
        response = await client.post(
            f"/api/v1/users/block/{test_user2['user_id']}",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201 or response.status_code == 200

    @pytest.mark.asyncio
    async def test_block_user_without_auth(
        self, 
        client: AsyncClient, 
        test_user2: dict
    ):
        """Test blocking user without authentication returns 401."""
        # Act
        response = await client.post(f"/api/v1/users/block/{test_user2['user_id']}")
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_unblock_user_success(
        self, 
        client: AsyncClient, 
        test_user2: dict,
        auth_headers: dict
    ):
        """Test successful user unblocking."""
        # Arrange - First block the user
        await client.post(
            f"/api/v1/users/block/{test_user2['user_id']}",
            headers=auth_headers
        )
        
        # Act
        response = await client.delete(
            f"/api/v1/users/block/{test_user2['user_id']}",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 204 or response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_blocked_users(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting list of blocked users."""
        # Act
        response = await client.get(
            "/api/v1/users/me/blocked",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
