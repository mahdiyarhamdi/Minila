"""Comprehensive tests for message endpoints with rate limiting and community checks."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis


# ==================== POST /api/v1/messages/ ====================

class TestSendMessage:
    """Test cases for sending messages with community check and rate limiting."""

    @pytest.mark.asyncio
    async def test_send_message_success_with_common_community(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test successful message send between users with common community."""
        # Arrange - Clear rate limit
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        payload = {
            "receiver_id": test_user2["user_id"],
            "body": "Test message with common community"
        }
        
        # Act
        response = await client.post(
            "/api/v1/messages/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["sender"]["id"] == test_user["user_id"]
        assert data["receiver"]["id"] == test_user2["user_id"]
        assert data["body"] == payload["body"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_send_message_blocked_no_common_community(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_community2: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis,
        test_db: AsyncSession
    ):
        """Test message blocked when users have no common community."""
        # Arrange - Clear rate limit
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        # Remove user2 from community1 (remove common community)
        from app.models.membership import Membership
        from sqlalchemy import select, delete
        
        await test_db.execute(
            delete(Membership).where(
                Membership.user_id == test_user2["user_id"],
                Membership.community_id == test_community["id"]
            )
        )
        await test_db.commit()
        
        payload = {
            "receiver_id": test_user2["user_id"],
            "body": "This should be blocked"
        }
        
        # Act
        response = await client.post(
            "/api/v1/messages/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 403
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_send_message_rate_limit_exceeded(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test rate limiting - maximum 5 messages per day."""
        # Arrange - Clear rate limit first
        await redis_client.delete(f"msg:{test_user['user_id']}")
        
        payload = {
            "receiver_id": test_user2["user_id"],
            "body": "Rate limit test message"
        }
        
        # Act - Send 5 messages (should all succeed)
        for i in range(5):
            response = await client.post(
                "/api/v1/messages/", 
                json={**payload, "body": f"Message {i+1}"},
                headers=auth_headers
            )
            assert response.status_code == 201, f"Message {i+1} failed"
        
        # Act - Send 6th message (should fail with 429)
        response = await client.post(
            "/api/v1/messages/", 
            json={**payload, "body": "Message 6 - should fail"},
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 429
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_send_message_without_auth(self, client: AsyncClient):
        """Test sending message without authentication returns 401."""
        # Arrange
        payload = {
            "receiver_id": 2,
            "body": "Unauthorized message"
        }
        
        # Act
        response = await client.post("/api/v1/messages/", json=payload)
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_send_message_validation_error_missing_body(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test sending message with missing body returns 422."""
        # Arrange
        payload = {
            "receiver_id": 2
            # Missing body field
        }
        
        # Act
        response = await client.post(
            "/api/v1/messages/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_send_message_validation_error_empty_body(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test sending message with empty body returns 422."""
        # Arrange
        payload = {
            "receiver_id": 2,
            "body": ""
        }
        
        # Act
        response = await client.post(
            "/api/v1/messages/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_send_message_to_nonexistent_user(
        self, 
        client: AsyncClient, 
        auth_headers: dict,
        redis_client: aioredis.Redis,
        test_user: dict
    ):
        """Test sending message to non-existent user returns 400."""
        # Arrange - Clear rate limit
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        payload = {
            "receiver_id": 99999,
            "body": "Message to non-existent user"
        }
        
        # Act
        response = await client.post(
            "/api/v1/messages/", 
            json=payload, 
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 400


# ==================== GET /api/v1/messages/inbox ====================

class TestGetInbox:
    """Test cases for getting inbox messages."""

    @pytest.mark.asyncio
    async def test_get_inbox_with_messages(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        redis_client: aioredis.Redis
    ):
        """Test getting inbox with received messages."""
        # Arrange - Clear rate limit and send a message from user1 to user2
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Test inbox message"},
            headers=auth_headers
        )
        
        # Act - Get user2's inbox
        response = await client.get(
            "/api/v1/messages/inbox?page=1&page_size=10",
            headers=auth_headers_user2
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert data["total"] >= 1
        # Verify message is in inbox
        message_bodies = [msg["body"] for msg in data["items"]]
        assert "Test inbox message" in message_bodies

    @pytest.mark.asyncio
    async def test_get_inbox_only_received_messages(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        redis_client: aioredis.Redis
    ):
        """Test inbox contains only received messages, not sent."""
        # Arrange - Clear rate limits
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        await redis_client.delete(f"test:msg:{test_user2['user_id']}")
        
        # User1 sends to User2
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "From user1 to user2"},
            headers=auth_headers
        )
        
        # User2 sends to User1
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user["user_id"], "body": "From user2 to user1"},
            headers=auth_headers_user2
        )
        
        # Act - Get user1's inbox
        response = await client.get(
            "/api/v1/messages/inbox",
            headers=auth_headers
        )
        
        # Assert - User1 should only see message FROM user2
        assert response.status_code == 200
        data = response.json()
        for message in data["items"]:
            assert message["receiver"]["id"] == test_user["user_id"]
            assert message["sender"]["id"] == test_user2["user_id"]

    @pytest.mark.asyncio
    async def test_get_inbox_newest_first(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        redis_client: aioredis.Redis
    ):
        """Test inbox messages are ordered by newest first."""
        # Arrange - Clear rate limit and send multiple messages
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "First message"},
            headers=auth_headers
        )
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Second message"},
            headers=auth_headers
        )
        
        # Act
        response = await client.get(
            "/api/v1/messages/inbox",
            headers=auth_headers_user2
        )
        
        # Assert - Newest (Second message) should come first
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) >= 2:
            # Check that created_at is descending
            timestamps = [msg["created_at"] for msg in data["items"]]
            assert timestamps == sorted(timestamps, reverse=True)

    @pytest.mark.asyncio
    async def test_get_inbox_without_auth(self, client: AsyncClient):
        """Test getting inbox without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/messages/inbox")
        
        # Assert
        assert response.status_code == 401


# ==================== GET /api/v1/messages/sent ====================

class TestGetSent:
    """Test cases for getting sent messages."""

    @pytest.mark.asyncio
    async def test_get_sent_with_messages(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test getting sent messages list with pagination."""
        # Arrange - Clear rate limit and send a message
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Test sent message"},
            headers=auth_headers
        )
        
        # Act
        response = await client.get(
            "/api/v1/messages/sent?page=1&page_size=10",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        # Verify message is in sent box
        message_bodies = [msg["body"] for msg in data["items"]]
        assert "Test sent message" in message_bodies

    @pytest.mark.asyncio
    async def test_get_sent_only_sent_messages(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        auth_headers_user2: dict,
        redis_client: aioredis.Redis
    ):
        """Test sent box contains only sent messages, not received."""
        # Arrange - Clear rate limits
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        await redis_client.delete(f"test:msg:{test_user2['user_id']}")
        
        # User1 sends to User2
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "From user1 to user2"},
            headers=auth_headers
        )
        
        # User2 sends to User1
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user["user_id"], "body": "From user2 to user1"},
            headers=auth_headers_user2
        )
        
        # Act - Get user1's sent messages
        response = await client.get(
            "/api/v1/messages/sent",
            headers=auth_headers
        )
        
        # Assert - User1 should only see message TO user2
        assert response.status_code == 200
        data = response.json()
        for message in data["items"]:
            assert message["sender"]["id"] == test_user["user_id"]
            assert message["receiver"]["id"] == test_user2["user_id"]

    @pytest.mark.asyncio
    async def test_get_sent_newest_first(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test sent messages are ordered by newest first."""
        # Arrange - Clear rate limit and send multiple messages
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "First sent"},
            headers=auth_headers
        )
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Second sent"},
            headers=auth_headers
        )
        
        # Act
        response = await client.get(
            "/api/v1/messages/sent",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) >= 2:
            # Check that created_at is descending
            timestamps = [msg["created_at"] for msg in data["items"]]
            assert timestamps == sorted(timestamps, reverse=True)

    @pytest.mark.asyncio
    async def test_get_sent_without_auth(self, client: AsyncClient):
        """Test getting sent messages without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/messages/sent")
        
        # Assert
        assert response.status_code == 401
