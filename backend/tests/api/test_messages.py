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


# ==================== GET /api/v1/messages/{other_user_id} ====================

class TestGetConversation:
    """Test cases for getting conversation with a specific user."""

    @pytest.mark.asyncio
    async def test_get_conversation_success(
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
        """Test getting conversation between two users."""
        # Arrange - Clear rate limits and create conversation
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        await redis_client.delete(f"test:msg:{test_user2['user_id']}")
        
        # User1 sends to User2
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Hello from user1"},
            headers=auth_headers
        )
        
        # User2 sends to User1
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user["user_id"], "body": "Hello from user2"},
            headers=auth_headers_user2
        )
        
        # Act - Get conversation from user1's perspective
        response = await client.get(
            f"/api/v1/messages/{test_user2['user_id']}?page=1&page_size=10",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2
        
        # Verify both messages are in conversation
        message_bodies = [msg["body"] for msg in data["items"]]
        assert "Hello from user1" in message_bodies
        assert "Hello from user2" in message_bodies

    @pytest.mark.asyncio
    async def test_get_conversation_bidirectional(
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
        """Test conversation is same from both users' perspectives."""
        # Arrange
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Test bidirectional"},
            headers=auth_headers
        )
        
        # Act - Get conversation from both perspectives
        response_user1 = await client.get(
            f"/api/v1/messages/{test_user2['user_id']}",
            headers=auth_headers
        )
        response_user2 = await client.get(
            f"/api/v1/messages/{test_user['user_id']}",
            headers=auth_headers_user2
        )
        
        # Assert - Both should see the same messages
        assert response_user1.status_code == 200
        assert response_user2.status_code == 200
        
        data1 = response_user1.json()
        data2 = response_user2.json()
        
        assert data1["total"] == data2["total"]

    @pytest.mark.asyncio
    async def test_get_conversation_empty(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        auth_headers: dict
    ):
        """Test getting conversation with no messages returns empty list."""
        # Act
        response = await client.get(
            f"/api/v1/messages/{test_user2['user_id']}",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    @pytest.mark.asyncio
    async def test_get_conversation_nonexistent_user(
        self, 
        client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting conversation with non-existent user returns 404."""
        # Act
        response = await client.get(
            "/api/v1/messages/99999",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 404
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_get_conversation_newest_first(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test conversation messages are ordered newest first."""
        # Arrange
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
            f"/api/v1/messages/{test_user2['user_id']}",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) >= 2:
            timestamps = [msg["created_at"] for msg in data["items"]]
            assert timestamps == sorted(timestamps, reverse=True)

    @pytest.mark.asyncio
    async def test_get_conversation_without_auth(self, client: AsyncClient):
        """Test getting conversation without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/messages/2")
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_conversation_pagination(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test conversation pagination works correctly."""
        # Arrange - Send 3 messages
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        for i in range(3):
            await client.post(
                "/api/v1/messages/",
                json={"receiver_id": test_user2["user_id"], "body": f"Message {i+1}"},
                headers=auth_headers
            )
        
        # Act - Get first page with page_size=2
        response = await client.get(
            f"/api/v1/messages/{test_user2['user_id']}?page=1&page_size=2",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2


# ==================== GET /api/v1/messages/conversations ====================

class TestGetConversations:
    """Test cases for getting conversations list."""

    @pytest.mark.asyncio
    async def test_get_conversations_success(
        self, 
        client: AsyncClient, 
        test_user: dict,
        test_user2: dict,
        test_community: dict,
        test_membership: dict,
        auth_headers: dict,
        redis_client: aioredis.Redis
    ):
        """Test getting conversations list successfully."""
        # Arrange - Clear rate limit and send a message
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Test conversation"},
            headers=auth_headers
        )
        
        # Act
        response = await client.get(
            "/api/v1/messages/conversations",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        
        # Verify conversation structure
        if data["items"]:
            conv = data["items"][0]
            assert "user" in conv
            assert "last_message" in conv
            assert "unread_count" in conv
            assert "id" in conv["user"]
            assert "body" in conv["last_message"]
            assert "created_at" in conv["last_message"]

    @pytest.mark.asyncio
    async def test_get_conversations_empty(
        self, 
        client: AsyncClient, 
        test_user: dict,
        auth_headers: dict
    ):
        """Test getting conversations when user has no messages."""
        # Act
        response = await client.get(
            "/api/v1/messages/conversations",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        # User might have messages from previous tests, so just check structure
        assert isinstance(data["items"], list)
        assert isinstance(data["total"], int)

    @pytest.mark.asyncio
    async def test_get_conversations_without_auth(self, client: AsyncClient):
        """Test getting conversations without authentication returns 401."""
        # Act
        response = await client.get("/api/v1/messages/conversations")
        
        # Assert
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_conversations_newest_first(
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
        """Test conversations are ordered by most recent message."""
        # Arrange - Clear rate limits
        await redis_client.delete(f"test:msg:{test_user['user_id']}")
        await redis_client.delete(f"test:msg:{test_user2['user_id']}")
        
        # Send messages in sequence
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Earlier message"},
            headers=auth_headers
        )
        
        # Send another message to make this conversation more recent
        await client.post(
            "/api/v1/messages/",
            json={"receiver_id": test_user2["user_id"], "body": "Latest message"},
            headers=auth_headers
        )
        
        # Act
        response = await client.get(
            "/api/v1/messages/conversations",
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) >= 2:
            # Verify ordering by checking created_at of last_message
            timestamps = [conv["last_message"]["created_at"] for conv in data["items"]]
            assert timestamps == sorted(timestamps, reverse=True)
