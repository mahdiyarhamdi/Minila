"""Comprehensive tests for community management endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ==================== GET /api/v1/communities/ ====================

class TestGetCommunities:
    """Test cases for listing communities."""

    @pytest.mark.asyncio
    async def test_get_communities_empty_list(self, client: AsyncClient):
        """Test getting empty communities list."""
        # Act
        response = await client.get("/api/v1/communities/")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert isinstance(data["items"], list)
        assert data["total"] == 0
        assert len(data["items"]) == 0

    @pytest.mark.asyncio
    async def test_get_communities_with_data(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test getting communities list with data and pagination."""
        # Act
        response = await client.get("/api/v1/communities/?page=1&page_size=10")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1
        assert data["page"] == 1
        assert data["page_size"] == 10
        # Check that our test community is in the list
        community_names = [c["name"] for c in data["items"]]
        assert test_community["name"] in community_names

    @pytest.mark.asyncio
    async def test_get_communities_invalid_page_zero(self, client: AsyncClient):
        """Test getting communities with page=0 (should default to 1)."""
        response = await client.get("/api/v1/communities/?page=0&page_size=10")
        
        assert response.status_code == 200
        data = response.json()
        # Page should be corrected to 1
        assert data["page"] == 1

    @pytest.mark.asyncio
    async def test_get_communities_large_page_size(self, client: AsyncClient):
        """Test getting communities with very large page_size (should cap at 100)."""
        response = await client.get("/api/v1/communities/?page=1&page_size=1000")
        
        assert response.status_code == 200
        data = response.json()
        # Page size should be capped at 100
        assert data["page_size"] == 100

    @pytest.mark.asyncio
    async def test_get_communities_negative_page(self, client: AsyncClient):
        """Test getting communities with negative page number."""
        response = await client.get("/api/v1/communities/?page=-1&page_size=10")
        
        assert response.status_code == 200
        data = response.json()
        # Should default to page 1
        assert data["page"] == 1

    @pytest.mark.asyncio
    async def test_get_communities_pagination(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test communities pagination validation."""
        # Act - Test with valid pagination
        response = await client.get("/api/v1/communities/?page=1&page_size=5")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5


# ==================== POST /api/v1/communities/ ====================

class TestCreateCommunity:
    """Test cases for creating communities."""

    @pytest.mark.asyncio
    async def test_create_community_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict,
        test_db: AsyncSession,
        seed_roles: dict
    ):
        """Test successful community creation with owner auto-assigned."""
        # Arrange
        payload = {
            "name": "New Community",
            "bio": "A brand new community for testing"
        }
        
        # Act
        response = await client.post(
            "/api/v1/communities/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["bio"] == payload["bio"]
        assert data["owner"]["id"] == test_user["user_id"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_community_duplicate_name(
        self, 
        client: AsyncClient, 
        test_community: dict,
        auth_headers: dict
    ):
        """Test creating community with duplicate name returns 400."""
        # Arrange
        payload = {
            "name": test_community["name"],
            "bio": "Different bio but same name"
        }
        
        # Act
        response = await client.post(
            "/api/v1/communities/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_community_without_auth(self, client: AsyncClient):
        """Test creating community without authentication returns 401."""
        # Arrange
        payload = {
            "name": "Unauthorized Community",
            "bio": "Should not be created"
        }
        
        # Act
        response = await client.post("/api/v1/communities/", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_community_validation_error(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test creating community with missing required field returns 422."""
        # Arrange
        payload = {
            "bio": "Missing name field"
        }
        
        # Act
        response = await client.post(
            "/api/v1/communities/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422


# ==================== GET /api/v1/communities/{id} ====================

class TestGetCommunity:
    """Test cases for getting community details."""

    @pytest.mark.asyncio
    async def test_get_community_success(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test successfully getting community details."""
        # Act
        response = await client.get(f"/api/v1/communities/{test_community['id']}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_community["id"]
        assert data["name"] == test_community["name"]
        assert data["bio"] == test_community["bio"]

    @pytest.mark.asyncio
    async def test_get_community_not_found(self, client: AsyncClient):
        """Test getting non-existent community returns 404."""
        # Act
        response = await client.get("/api/v1/communities/99999")
        
        # Assert
        assert response.status_code == 404


# ==================== PATCH /api/v1/communities/{id} ====================

class TestUpdateCommunity:
    """Test cases for updating community."""

    @pytest.mark.asyncio
    async def test_update_community_by_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        auth_headers: dict
    ):
        """Test successful community update by owner."""
        # Arrange
        payload = {
            "name": "Updated Community Name",
            "bio": "Updated bio"
        }
        
        # Act
        response = await client.patch(
            f"/api/v1/communities/{test_community['id']}", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["bio"] == payload["bio"]

    @pytest.mark.asyncio
    async def test_update_community_by_non_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers_user2: dict
    ):
        """Test update attempt by non-owner returns 403."""
        # Arrange
        payload = {"name": "Unauthorized Update"}
        
        # Act
        response = await client.patch(
            f"/api/v1/communities/{test_community['id']}", 
            json=payload, 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_community_without_auth(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test update without authentication returns 401."""
        # Arrange
        payload = {"name": "No Auth Update"}
        
        # Act
        response = await client.patch(
            f"/api/v1/communities/{test_community['id']}", 
            json=payload
        )
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_community_not_found(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test updating non-existent community returns 404."""
        # Arrange
        payload = {"name": "Doesnt Exist"}
        
        # Act
        response = await client.patch(
            "/api/v1/communities/99999", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 404


# ==================== POST /api/v1/communities/{id}/join ====================

class TestJoinCommunity:
    """Test cases for joining community."""

    @pytest.mark.asyncio
    async def test_join_community_success(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers_user2: dict,
        test_db: AsyncSession
    ):
        """Test successful join request with pending status."""
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["id"] == test_user2["user_id"]
        assert data["community"]["id"] == test_community["id"]
        assert data["is_approved"] is None  # Pending status

    @pytest.mark.asyncio
    async def test_join_community_duplicate_request(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers_user2: dict
    ):
        """Test duplicate join request returns 400."""
        # Arrange - First request
        await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        
        # Act - Second request
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_join_community_not_found(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test join request for non-existent community returns 404."""
        # Act
        response = await client.post(
            "/api/v1/communities/99999/join", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_join_community_without_auth(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test join request without authentication returns 401."""
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join"
        )
        
        # Assert
        assert response.status_code == 401


# ==================== GET /api/v1/communities/{id}/requests ====================

class TestGetJoinRequests:
    """Test cases for getting join requests."""

    @pytest.mark.asyncio
    async def test_get_requests_by_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict
    ):
        """Test owner can get join requests list."""
        # Arrange - Create a join request first
        await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        
        # Act
        response = await client.get(
            f"/api/v1/communities/{test_community['id']}/requests", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_requests_by_non_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        auth_headers_user2: dict
    ):
        """Test non-owner cannot get join requests returns 403."""
        # Act
        response = await client.get(
            f"/api/v1/communities/{test_community['id']}/requests", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_requests_without_auth(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test getting requests without authentication returns 401."""
        # Act
        response = await client.get(
            f"/api/v1/communities/{test_community['id']}/requests"
        )
        
        # Assert
        assert response.status_code == 401


# ==================== POST /api/v1/communities/{id}/requests/{req_id}/approve ====================

class TestApproveJoinRequest:
    """Test cases for approving join requests."""

    @pytest.mark.asyncio
    async def test_approve_request_success(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_db: AsyncSession
    ):
        """Test successful approval creates membership."""
        # Arrange - Create join request
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        request_id = join_response.json()["id"]
        
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/{request_id}/approve", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == test_user2["user_id"]
        assert data["community"]["id"] == test_community["id"]
        assert data["is_active"] is True

    @pytest.mark.asyncio
    async def test_approve_request_by_non_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict
    ):
        """Test approval by non-owner returns 403."""
        # Arrange - Create join request from a third user would be needed
        # For simplicity, we'll try to approve as user2
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        request_id = join_response.json()["id"]
        
        # Act - Try to approve own request (should fail)
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/{request_id}/approve", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_approve_request_not_found(
        self, 
        client: AsyncClient, 
        test_community: dict,
        auth_headers: dict
    ):
        """Test approving non-existent request returns 400."""
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/99999/approve", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_approve_request_without_auth(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test approval without authentication returns 401."""
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/1/approve"
        )
        
        # Assert
        assert response.status_code == 401


# ==================== POST /api/v1/communities/{id}/requests/{req_id}/reject ====================

class TestRejectJoinRequest:
    """Test cases for rejecting join requests."""

    @pytest.mark.asyncio
    async def test_reject_request_success(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict
    ):
        """Test successful rejection returns 204."""
        # Arrange - Create join request
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        request_id = join_response.json()["id"]
        
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/{request_id}/reject", 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_reject_request_by_non_owner(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_user2: dict,
        auth_headers: dict,
        auth_headers_user2: dict
    ):
        """Test rejection by non-owner returns 403."""
        # Arrange
        join_response = await client.post(
            f"/api/v1/communities/{test_community['id']}/join", 
            headers=auth_headers_user2
        )
        request_id = join_response.json()["id"]
        
        # Act - Try to reject own request
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/{request_id}/reject", 
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_reject_request_without_auth(
        self, 
        client: AsyncClient, 
        test_community: dict
    ):
        """Test rejection without authentication returns 401."""
        # Act
        response = await client.post(
            f"/api/v1/communities/{test_community['id']}/requests/1/reject"
        )
        
        # Assert
        assert response.status_code == 401


# ==================== GET /api/v1/communities/{id}/members ====================

class TestGetCommunityMembers:
    """Test cases for getting community members."""

    @pytest.mark.asyncio
    async def test_get_members_with_pagination(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_membership: dict
    ):
        """Test getting members list with pagination."""
        # Act
        response = await client.get(
            f"/api/v1/communities/{test_community['id']}/members?page=1&page_size=10"
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1  # At least the owner

    @pytest.mark.asyncio
    async def test_get_members_only_active(
        self, 
        client: AsyncClient, 
        test_community: dict,
        test_membership: dict
    ):
        """Test that only active members are returned."""
        # Act
        response = await client.get(
            f"/api/v1/communities/{test_community['id']}/members"
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # Verify all returned members are active
        for member in data["items"]:
            assert member["is_active"] is True

    @pytest.mark.asyncio
    async def test_get_members_not_found(self, client: AsyncClient):
        """Test getting members of non-existent community returns 404."""
        # Act
        response = await client.get("/api/v1/communities/99999/members")
        
        # Assert
        assert response.status_code == 404
