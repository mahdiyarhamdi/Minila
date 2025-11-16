"""Unit tests for card service."""
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta

from app.services import card_service
from app.models.card import Card
from app.schemas.card import CardFilter


@pytest.mark.asyncio
class TestGetCards:
    """Tests for get_cards function."""
    
    async def test_get_cards_success(self, mock_db_session, mock_card_repo):
        """تست دریافت لیست کارت‌ها موفق."""
        mock_cards = [
            Card(id=1, owner_id=1, is_sender=True),
            Card(id=2, owner_id=2, is_sender=False)
        ]
        mock_card_repo.get_all.return_value = (mock_cards, 2)
        
        filters = CardFilter()
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            result = await card_service.get_cards(
                mock_db_session,
                filters=filters,
                page=1,
                page_size=10
            )
        
        assert result.total == 2
        assert len(result.items) == 2
        mock_card_repo.get_all.assert_called_once()
    
    async def test_get_cards_empty(self, mock_db_session, mock_card_repo):
        """تست لیست خالی."""
        mock_card_repo.get_all.return_value = ([], 0)
        
        filters = CardFilter()
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            result = await card_service.get_cards(
                mock_db_session,
                filters=filters,
                page=1,
                page_size=10
            )
        
        assert result.total == 0
        assert len(result.items) == 0


@pytest.mark.asyncio
class TestGetCard:
    """Tests for get_card function."""
    
    async def test_get_card_success(self, mock_db_session, mock_card_repo):
        """تست دریافت کارت موفق."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.get_by_id.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            card = await card_service.get_card(mock_db_session, card_id=1)
        
        assert card.id == 1
        mock_card_repo.get_by_id.assert_called_once_with(mock_db_session, 1)
    
    async def test_get_card_not_found(self, mock_db_session, mock_card_repo):
        """تست کارت ناموجود."""
        mock_card_repo.get_by_id.return_value = None
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await card_service.get_card(mock_db_session, card_id=999)


@pytest.mark.asyncio
class TestCreateCard:
    """Tests for create_card function."""
    
    async def test_create_card_success(
        self, 
        mock_db_session, 
        mock_card_repo, 
        mock_log_service
    ):
        """تست ساخت کارت موفق."""
        mock_card = Card(
            id=1,
            owner_id=1,
            is_sender=True,
            origin_country_id=1,
            origin_city_id=1,
            destination_country_id=2,
            destination_city_id=2
        )
        mock_card_repo.create.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with patch('app.services.card_service.log_service', mock_log_service):
                card = await card_service.create_card(
                    mock_db_session,
                    owner_id=1,
                    is_sender=True,
                    origin_country_id=1,
                    origin_city_id=1,
                    destination_country_id=2,
                    destination_city_id=2
                )
        
        assert card.id == 1
        mock_card_repo.create.assert_called_once()
        mock_log_service.log_event.assert_called_once()
        mock_db_session.commit.assert_called_once()
    
    async def test_create_card_with_communities(
        self, 
        mock_db_session, 
        mock_card_repo, 
        mock_log_service
    ):
        """تست ساخت کارت با کامیونیتی‌ها."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.create.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with patch('app.services.card_service.log_service', mock_log_service):
                card = await card_service.create_card(
                    mock_db_session,
                    owner_id=1,
                    is_sender=True,
                    origin_country_id=1,
                    origin_city_id=1,
                    destination_country_id=2,
                    destination_city_id=2,
                    community_ids=[1, 2, 3]
                )
        
        assert card.id == 1
        # Check that communities were added
        mock_card_repo.add_card_communities.assert_called_once()


@pytest.mark.asyncio
class TestUpdateCard:
    """Tests for update_card function."""
    
    async def test_update_card_success(
        self, 
        mock_db_session, 
        mock_card_repo, 
        mock_log_service
    ):
        """تست ویرایش کارت موفق."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.get_by_id.return_value = mock_card
        
        updated_card = Card(id=1, owner_id=1, is_sender=True, weight=10.5)
        mock_card_repo.update.return_value = updated_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with patch('app.services.card_service.log_service', mock_log_service):
                card = await card_service.update_card(
                    mock_db_session,
                    card_id=1,
                    user_id=1,
                    weight=10.5
                )
        
        mock_card_repo.update.assert_called_once()
        mock_log_service.log_event.assert_called_once()
    
    async def test_update_card_not_found(self, mock_db_session, mock_card_repo):
        """تست کارت ناموجود."""
        mock_card_repo.get_by_id.return_value = None
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await card_service.update_card(
                    mock_db_session,
                    card_id=999,
                    user_id=1,
                    weight=10.5
                )
    
    async def test_update_card_not_owner(self, mock_db_session, mock_card_repo):
        """تست ویرایش توسط غیر صاحب کارت."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.get_by_id.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with pytest.raises(PermissionError, match="مجاز"):
                await card_service.update_card(
                    mock_db_session,
                    card_id=1,
                    user_id=2,  # Different user
                    weight=10.5
                )


@pytest.mark.asyncio
class TestDeleteCard:
    """Tests for delete_card function."""
    
    async def test_delete_card_success(
        self, 
        mock_db_session, 
        mock_card_repo, 
        mock_log_service
    ):
        """تست حذف کارت موفق."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.get_by_id.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with patch('app.services.card_service.log_service', mock_log_service):
                result = await card_service.delete_card(
                    mock_db_session,
                    card_id=1,
                    user_id=1
                )
        
        assert result is True
        mock_card_repo.delete.assert_called_once()
        mock_log_service.log_event.assert_called_once()
    
    async def test_delete_card_not_found(self, mock_db_session, mock_card_repo):
        """تست حذف کارت ناموجود."""
        mock_card_repo.get_by_id.return_value = None
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await card_service.delete_card(
                    mock_db_session,
                    card_id=999,
                    user_id=1
                )
    
    async def test_delete_card_not_owner(self, mock_db_session, mock_card_repo):
        """تست حذف توسط غیر صاحب کارت."""
        mock_card = Card(id=1, owner_id=1, is_sender=True)
        mock_card_repo.get_by_id.return_value = mock_card
        
        with patch('app.services.card_service.card_repo', mock_card_repo):
            with pytest.raises(PermissionError, match="مجاز"):
                await card_service.delete_card(
                    mock_db_session,
                    card_id=1,
                    user_id=2  # Different user
                )
        
        # Should not call delete
        mock_card_repo.delete.assert_not_called()

