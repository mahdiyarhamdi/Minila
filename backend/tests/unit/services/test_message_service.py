"""Unit tests for message service."""
import pytest
from unittest.mock import AsyncMock, patch

from app.services import message_service
from app.models.user import User
from app.models.message import Message


@pytest.mark.asyncio
class TestSendMessage:
    """Tests for send_message function."""
    
    async def test_send_message_success(
        self, 
        mock_db_session, 
        mock_user_repo, 
        mock_message_repo, 
        mock_community_repo,
        mock_log_service
    ):
        """تست ارسال موفق پیام."""
        # Mock receiver
        mock_receiver = User(id=2, email="receiver@example.com", is_active=True)
        mock_user_repo.get_by_id.return_value = mock_receiver
        
        # Mock common community check
        mock_community_repo.check_common_membership.return_value = True
        
        # Mock message creation
        mock_message = Message(id=1, sender_id=1, receiver_id=2, body="Test message")
        mock_message_repo.create.return_value = mock_message
        
        # Mock sender for email notification
        mock_sender = User(id=1, email="sender@example.com", first_name="Sender")
        
        with patch('app.services.message_service.user_repo', mock_user_repo):
            with patch('app.services.message_service.message_repo', mock_message_repo):
                with patch('app.services.message_service.community_repo', mock_community_repo):
                    with patch('app.services.message_service.log_service', mock_log_service):
                        with patch('app.services.message_service.send_message_notification'):
                            # Set side_effect to return different users
                            mock_user_repo.get_by_id.side_effect = [mock_receiver, mock_sender]
                            
                            message = await message_service.send_message(
                                mock_db_session,
                                sender_id=1,
                                receiver_id=2,
                                body="Test message"
                            )
        
        assert message.id == 1
        mock_message_repo.create.assert_called_once()
        mock_log_service.log_event.assert_called_once()
    
    async def test_send_message_to_self(self, mock_db_session):
        """تست ارسال پیام به خود."""
        with pytest.raises(ValueError, match="خودتان"):
            await message_service.send_message(
                mock_db_session,
                sender_id=1,
                receiver_id=1,
                body="Test"
            )
    
    async def test_send_message_receiver_not_found(
        self, 
        mock_db_session, 
        mock_user_repo
    ):
        """تست گیرنده ناموجود."""
        mock_user_repo.get_by_id.return_value = None
        
        with patch('app.services.message_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await message_service.send_message(
                    mock_db_session,
                    sender_id=1,
                    receiver_id=999,
                    body="Test"
                )
    
    async def test_send_message_receiver_inactive(
        self, 
        mock_db_session, 
        mock_user_repo
    ):
        """تست گیرنده غیرفعال."""
        mock_receiver = User(id=2, email="receiver@example.com", is_active=False)
        mock_user_repo.get_by_id.return_value = mock_receiver
        
        with patch('app.services.message_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="غیرفعال"):
                await message_service.send_message(
                    mock_db_session,
                    sender_id=1,
                    receiver_id=2,
                    body="Test"
                )
    
    async def test_send_message_no_common_community(
        self, 
        mock_db_session, 
        mock_user_repo, 
        mock_community_repo,
        mock_log_service
    ):
        """تست عدم وجود کامیونیتی مشترک."""
        mock_receiver = User(id=2, email="receiver@example.com", is_active=True)
        mock_user_repo.get_by_id.return_value = mock_receiver
        
        # No common community
        mock_community_repo.check_common_membership.return_value = False
        
        with patch('app.services.message_service.user_repo', mock_user_repo):
            with patch('app.services.message_service.community_repo', mock_community_repo):
                with patch('app.services.message_service.log_service', mock_log_service):
                    with pytest.raises(PermissionError, match="مشترکی"):
                        await message_service.send_message(
                            mock_db_session,
                            sender_id=1,
                            receiver_id=2,
                            body="Test"
                        )
        
        # Check that blocked event was logged
        mock_log_service.log_event.assert_called_once()


@pytest.mark.asyncio
class TestGetInbox:
    """Tests for get_inbox function."""
    
    async def test_get_inbox_success(self, mock_db_session, mock_message_repo):
        """تست دریافت inbox موفق."""
        mock_messages = [
            Message(id=1, sender_id=2, receiver_id=1, body="Message 1"),
            Message(id=2, sender_id=3, receiver_id=1, body="Message 2")
        ]
        mock_message_repo.get_inbox.return_value = (mock_messages, 2)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_inbox(
                mock_db_session,
                user_id=1,
                page=1,
                page_size=10
            )
        
        assert result.total == 2
        assert len(result.items) == 2
        assert result.page == 1
        mock_message_repo.get_inbox.assert_called_once_with(mock_db_session, 1, 1, 10)
    
    async def test_get_inbox_empty(self, mock_db_session, mock_message_repo):
        """تست inbox خالی."""
        mock_message_repo.get_inbox.return_value = ([], 0)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_inbox(
                mock_db_session,
                user_id=1,
                page=1,
                page_size=10
            )
        
        assert result.total == 0
        assert len(result.items) == 0
    
    async def test_get_inbox_pagination(self, mock_db_session, mock_message_repo):
        """تست pagination."""
        mock_messages = [Message(id=3, sender_id=2, receiver_id=1, body="Message 3")]
        mock_message_repo.get_inbox.return_value = (mock_messages, 25)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_inbox(
                mock_db_session,
                user_id=1,
                page=2,
                page_size=10
            )
        
        assert result.total == 25
        assert result.page == 2
        assert result.page_size == 10


@pytest.mark.asyncio
class TestGetSent:
    """Tests for get_sent function."""
    
    async def test_get_sent_success(self, mock_db_session, mock_message_repo):
        """تست دریافت sent messages موفق."""
        mock_messages = [
            Message(id=1, sender_id=1, receiver_id=2, body="Message 1"),
            Message(id=2, sender_id=1, receiver_id=3, body="Message 2")
        ]
        mock_message_repo.get_sent.return_value = (mock_messages, 2)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_sent(
                mock_db_session,
                user_id=1,
                page=1,
                page_size=10
            )
        
        assert result.total == 2
        assert len(result.items) == 2
        mock_message_repo.get_sent.assert_called_once_with(mock_db_session, 1, 1, 10)
    
    async def test_get_sent_empty(self, mock_db_session, mock_message_repo):
        """تست sent messages خالی."""
        mock_message_repo.get_sent.return_value = ([], 0)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_sent(
                mock_db_session,
                user_id=1,
                page=1,
                page_size=10
            )
        
        assert result.total == 0
        assert len(result.items) == 0
    
    async def test_get_sent_pagination(self, mock_db_session, mock_message_repo):
        """تست pagination."""
        mock_messages = [Message(id=15, sender_id=1, receiver_id=2, body="Message 15")]
        mock_message_repo.get_sent.return_value = (mock_messages, 30)
        
        with patch('app.services.message_service.message_repo', mock_message_repo):
            result = await message_service.get_sent(
                mock_db_session,
                user_id=1,
                page=3,
                page_size=10
            )
        
        assert result.total == 30
        assert result.page == 3
        assert result.page_size == 10

