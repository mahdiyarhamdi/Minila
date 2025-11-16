"""Unit tests for message repository."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy import select

from app.repositories import message_repo
from app.models.message import Message
from app.models.user import User


@pytest.mark.asyncio
class TestCreateMessage:
    """Tests for create message."""
    
    async def test_create_message(self, test_db: AsyncMock, test_user: dict, test_user2: dict):
        """تست ساخت پیام."""
        # This is an integration test, so we test with real DB
        message = await message_repo.create(
            test_db,
            sender_id=test_user["user_id"],
            receiver_id=test_user2["user_id"],
            body="Test message"
        )
        
        assert message is not None
        assert message.sender_id == test_user["user_id"]
        assert message.receiver_id == test_user2["user_id"]
        assert message.body == "Test message"


@pytest.mark.asyncio
class TestGetInbox:
    """Tests for get_inbox function."""
    
    async def test_get_inbox_pagination(self, test_db: AsyncMock, test_user: dict, test_user2: dict):
        """تست pagination."""
        # Create multiple messages
        for i in range(15):
            await message_repo.create(
                test_db,
                sender_id=test_user2["user_id"],
                receiver_id=test_user["user_id"],
                body=f"Message {i}"
            )
        
        # Get first page
        messages, total = await message_repo.get_inbox(test_db, test_user["user_id"], page=1, page_size=10)
        
        assert total == 15
        assert len(messages) == 10
        
        # Get second page
        messages, total = await message_repo.get_inbox(test_db, test_user["user_id"], page=2, page_size=10)
        
        assert total == 15
        assert len(messages) == 5
    
    async def test_get_inbox_ordering(self, test_db: AsyncMock, test_user: dict, test_user2: dict):
        """تست ترتیب پیام‌ها (جدیدترین اول)."""
        # Create messages
        msg1 = await message_repo.create(
            test_db,
            sender_id=test_user2["user_id"],
            receiver_id=test_user["user_id"],
            body="First message"
        )
        
        msg2 = await message_repo.create(
            test_db,
            sender_id=test_user2["user_id"],
            receiver_id=test_user["user_id"],
            body="Second message"
        )
        
        messages, total = await message_repo.get_inbox(test_db, test_user["user_id"], page=1, page_size=10)
        
        # Newest first
        assert messages[0].id == msg2.id
        assert messages[1].id == msg1.id
    
    async def test_get_inbox_empty(self, test_db: AsyncMock, test_user: dict):
        """تست inbox خالی."""
        messages, total = await message_repo.get_inbox(test_db, test_user["user_id"], page=1, page_size=10)
        
        assert total == 0
        assert len(messages) == 0


@pytest.mark.asyncio
class TestGetSent:
    """Tests for get_sent function."""
    
    async def test_get_sent_pagination(self, test_db: AsyncMock, test_user: dict, test_user2: dict):
        """تست pagination."""
        # Create multiple messages
        for i in range(12):
            await message_repo.create(
                test_db,
                sender_id=test_user["user_id"],
                receiver_id=test_user2["user_id"],
                body=f"Message {i}"
            )
        
        # Get first page
        messages, total = await message_repo.get_sent(test_db, test_user["user_id"], page=1, page_size=10)
        
        assert total == 12
        assert len(messages) == 10
        
        # Get second page
        messages, total = await message_repo.get_sent(test_db, test_user["user_id"], page=2, page_size=10)
        
        assert total == 12
        assert len(messages) == 2
    
    async def test_get_sent_ordering(self, test_db: AsyncMock, test_user: dict, test_user2: dict):
        """تست ترتیب پیام‌ها."""
        msg1 = await message_repo.create(
            test_db,
            sender_id=test_user["user_id"],
            receiver_id=test_user2["user_id"],
            body="First message"
        )
        
        msg2 = await message_repo.create(
            test_db,
            sender_id=test_user["user_id"],
            receiver_id=test_user2["user_id"],
            body="Second message"
        )
        
        messages, total = await message_repo.get_sent(test_db, test_user["user_id"], page=1, page_size=10)
        
        # Newest first
        assert messages[0].id == msg2.id
        assert messages[1].id == msg1.id
    
    async def test_get_sent_empty(self, test_db: AsyncMock, test_user: dict):
        """تست sent خالی."""
        messages, total = await message_repo.get_sent(test_db, test_user["user_id"], page=1, page_size=10)
        
        assert total == 0
        assert len(messages) == 0

