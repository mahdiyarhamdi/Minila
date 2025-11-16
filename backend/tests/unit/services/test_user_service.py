"""Unit tests for user service."""
import pytest
from unittest.mock import AsyncMock, patch

from app.services import user_service
from app.models.user import User


@pytest.mark.asyncio
class TestGetProfile:
    """Tests for get_profile function."""
    
    async def test_get_profile_success(self, mock_db_session, mock_user_repo):
        """تست دریافت پروفایل موفق."""
        mock_user = User(
            id=1,
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            user = await user_service.get_profile(mock_db_session, user_id=1)
        
        assert user.id == 1
        assert user.email == "test@example.com"
        mock_user_repo.get_by_id.assert_called_once_with(mock_db_session, 1)
    
    async def test_get_profile_not_found(self, mock_db_session, mock_user_repo):
        """تست کاربر ناموجود."""
        mock_user_repo.get_by_id.return_value = None
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await user_service.get_profile(mock_db_session, user_id=999)


@pytest.mark.asyncio
class TestUpdateProfile:
    """Tests for update_profile function."""
    
    async def test_update_profile_success(
        self, 
        mock_db_session, 
        mock_user_repo, 
        mock_log_service
    ):
        """تست ویرایش پروفایل موفق."""
        mock_user = User(
            id=1,
            email="test@example.com",
            first_name="Old",
            last_name="Name"
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        updated_user = User(
            id=1,
            email="test@example.com",
            first_name="New",
            last_name="Name"
        )
        mock_user_repo.update_user.return_value = updated_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with patch('app.services.user_service.log_service', mock_log_service):
                result = await user_service.update_profile(
                    mock_db_session,
                    user_id=1,
                    first_name="New"
                )
        
        mock_user_repo.update_user.assert_called_once()
        mock_log_service.log_event.assert_called_once()
        mock_db_session.commit.assert_called_once()
    
    async def test_update_profile_user_not_found(self, mock_db_session, mock_user_repo):
        """تست کاربر ناموجود."""
        mock_user_repo.get_by_id.return_value = None
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await user_service.update_profile(
                    mock_db_session,
                    user_id=999,
                    first_name="New"
                )
    
    async def test_update_profile_no_changes(
        self, 
        mock_db_session, 
        mock_user_repo
    ):
        """تست بدون تغییرات (همه فیلدها None)."""
        mock_user = User(
            id=1,
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            result = await user_service.update_profile(
                mock_db_session,
                user_id=1,
                first_name=None,
                last_name=None
            )
        
        # Should return original user without calling update
        assert result.id == 1
        mock_user_repo.update_user.assert_not_called()
    
    async def test_update_profile_partial(
        self, 
        mock_db_session, 
        mock_user_repo, 
        mock_log_service
    ):
        """تست ویرایش جزئی (فقط یک فیلد)."""
        mock_user = User(
            id=1,
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
        mock_user_repo.get_by_id.return_value = mock_user
        mock_user_repo.update_user.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with patch('app.services.user_service.log_service', mock_log_service):
                await user_service.update_profile(
                    mock_db_session,
                    user_id=1,
                    bio="New bio"
                )
        
        # Check that only non-None fields were passed
        call_kwargs = mock_user_repo.update_user.call_args[1]
        assert "bio" in call_kwargs
        assert call_kwargs["bio"] == "New bio"


@pytest.mark.asyncio
class TestChangePassword:
    """Tests for change_password function."""
    
    async def test_change_password_success(
        self, 
        mock_db_session, 
        mock_user_repo, 
        mock_log_service
    ):
        """تست تغییر پسورد موفق."""
        from app.core.security import hash_password
        
        mock_user = User(
            id=1,
            email="test@example.com",
            password=hash_password("OldPassword123!")
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with patch('app.services.user_service.log_service', mock_log_service):
                result = await user_service.change_password(
                    mock_db_session,
                    user_id=1,
                    old_password="OldPassword123!",
                    new_password="NewPassword456!"
                )
        
        assert result is True
        mock_user_repo.update_password.assert_called_once()
        mock_log_service.log_event.assert_called_once()
        mock_db_session.commit.assert_called_once()
    
    async def test_change_password_user_not_found(self, mock_db_session, mock_user_repo):
        """تست کاربر ناموجود."""
        mock_user_repo.get_by_id.return_value = None
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await user_service.change_password(
                    mock_db_session,
                    user_id=999,
                    old_password="old",
                    new_password="new"
                )
    
    async def test_change_password_no_password_set(self, mock_db_session, mock_user_repo):
        """تست کاربر بدون پسورد."""
        mock_user = User(
            id=1,
            email="test@example.com",
            password=None
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="تنظیم نشده"):
                await user_service.change_password(
                    mock_db_session,
                    user_id=1,
                    old_password="old",
                    new_password="new"
                )
    
    async def test_change_password_wrong_old_password(self, mock_db_session, mock_user_repo):
        """تست پسورد قدیمی اشتباه."""
        from app.core.security import hash_password
        
        mock_user = User(
            id=1,
            email="test@example.com",
            password=hash_password("CorrectPassword123!")
        )
        mock_user_repo.get_by_id.return_value = mock_user
        
        with patch('app.services.user_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="نادرست"):
                await user_service.change_password(
                    mock_db_session,
                    user_id=1,
                    old_password="WrongPassword",
                    new_password="NewPassword456!"
                )
        
        # Should not call update_password
        mock_user_repo.update_password.assert_not_called()

