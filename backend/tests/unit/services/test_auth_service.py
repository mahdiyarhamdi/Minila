"""Unit tests for authentication service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from app.services import auth_service
from app.models.user import User


class TestGenerateOTP:
    """Tests for generate_otp function."""
    
    def test_generate_otp_length(self):
        """تست طول کد OTP."""
        otp = auth_service.generate_otp()
        assert len(otp) == 6
    
    def test_generate_otp_is_numeric(self):
        """تست اینکه OTP فقط عدد است."""
        otp = auth_service.generate_otp()
        assert otp.isdigit()
    
    def test_generate_otp_uniqueness(self):
        """تست تولید OTP های مختلف (احتمالاً)."""
        otps = [auth_service.generate_otp() for _ in range(10)]
        # حداقل یکی از آن‌ها باید متفاوت باشد (با احتمال بسیار بالا)
        assert len(set(otps)) > 1


class TestCreateTokens:
    """Tests for create_tokens function."""
    
    def test_create_tokens_success(self):
        """تست ساخت موفق tokens."""
        tokens = auth_service.create_tokens(user_id=1, email="test@example.com")
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert "token_type" in tokens
        assert "expires_in" in tokens
        assert tokens["token_type"] == "bearer"
        assert isinstance(tokens["expires_in"], int)
    
    def test_create_tokens_returns_different_tokens(self):
        """تست اینکه access و refresh token متفاوت هستند."""
        tokens = auth_service.create_tokens(user_id=1, email="test@example.com")
        
        assert tokens["access_token"] != tokens["refresh_token"]


class TestRefreshAccessToken:
    """Tests for refresh_access_token function."""
    
    def test_refresh_token_success(self):
        """تست refresh موفق."""
        # ساخت refresh token معتبر
        original_tokens = auth_service.create_tokens(user_id=1, email="test@example.com")
        refresh_token = original_tokens["refresh_token"]
        
        # Refresh کردن
        new_tokens = auth_service.refresh_access_token(refresh_token)
        
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        assert new_tokens["token_type"] == "bearer"
    
    def test_refresh_token_invalid(self):
        """تست توکن نامعتبر."""
        with pytest.raises(ValueError, match="نامعتبر است"):
            auth_service.refresh_access_token("invalid_token")
    
    def test_refresh_token_empty(self):
        """تست توکن خالی."""
        with pytest.raises(ValueError):
            auth_service.refresh_access_token("")


@pytest.mark.asyncio
class TestSignup:
    """Tests for signup function."""
    
    async def test_signup_success(self, mock_db_session, mock_user_repo, mock_log_service):
        """تست ثبت‌نام موفق."""
        # Mock repository responses
        mock_user_repo.email_exists.return_value = False
        mock_user = User(
            id=1,
            email="newuser@example.com",
            first_name="New",
            last_name="User",
            email_verified=False
        )
        mock_user_repo.create.return_value = mock_user
        
        # Mock email sending
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with patch('app.services.auth_service.log_service', mock_log_service):
                with patch('app.services.auth_service.send_otp_email'):
                    user = await auth_service.signup(
                        mock_db_session,
                        "newuser@example.com",
                        "password123",
                        "New",
                        "User"
                    )
        
        assert user.email == "newuser@example.com"
        mock_user_repo.email_exists.assert_called_once()
        mock_user_repo.create.assert_called_once()
        mock_db_session.commit.assert_called_once()
    
    async def test_signup_duplicate_email(self, mock_db_session, mock_user_repo):
        """تست ثبت‌نام با ایمیل تکراری."""
        mock_user_repo.email_exists.return_value = True
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="قبلاً ثبت شده"):
                await auth_service.signup(
                    mock_db_session,
                    "existing@example.com",
                    "password123",
                    "Test",
                    "User"
                )


@pytest.mark.asyncio
class TestVerifyEmailOTP:
    """Tests for verify_email_otp function."""
    
    async def test_verify_email_success(self, mock_db_session, mock_user_repo, mock_log_service):
        """تست تایید ایمیل موفق."""
        mock_user = User(
            id=1,
            email="test@example.com",
            email_verified=False,
            otp_code="123456",
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with patch('app.services.auth_service.log_service', mock_log_service):
                user = await auth_service.verify_email_otp(
                    mock_db_session,
                    "test@example.com",
                    "123456"
                )
        
        mock_user_repo.set_email_verified.assert_called_once()
        mock_user_repo.update_otp.assert_called_once()
    
    async def test_verify_email_wrong_otp(self, mock_db_session, mock_user_repo):
        """تست OTP اشتباه."""
        mock_user = User(
            id=1,
            email="test@example.com",
            email_verified=False,
            otp_code="123456",
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="نامعتبر"):
                await auth_service.verify_email_otp(
                    mock_db_session,
                    "test@example.com",
                    "wrong_code"
                )
    
    async def test_verify_email_expired_otp(self, mock_db_session, mock_user_repo):
        """تست OTP منقضی شده."""
        mock_user = User(
            id=1,
            email="test@example.com",
            email_verified=False,
            otp_code="123456",
            otp_expires_at=datetime.utcnow() - timedelta(minutes=1)
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="منقضی"):
                await auth_service.verify_email_otp(
                    mock_db_session,
                    "test@example.com",
                    "123456"
                )
    
    async def test_verify_email_already_verified(self, mock_db_session, mock_user_repo):
        """تست ایمیل قبلاً تایید شده."""
        mock_user = User(
            id=1,
            email="test@example.com",
            email_verified=True
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="قبلاً تایید"):
                await auth_service.verify_email_otp(
                    mock_db_session,
                    "test@example.com",
                    "123456"
                )


@pytest.mark.asyncio
class TestRequestOTP:
    """Tests for request_otp function."""
    
    async def test_request_otp_success(self, mock_db_session, mock_user_repo, mock_log_service):
        """تست درخواست OTP موفق."""
        mock_user = User(
            id=1,
            email="test@example.com",
            is_active=True,
            email_verified=True
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with patch('app.services.auth_service.log_service', mock_log_service):
                with patch('app.services.auth_service.send_otp_email'):
                    result = await auth_service.request_otp(
                        mock_db_session,
                        "test@example.com"
                    )
        
        assert result is True
        mock_user_repo.update_otp.assert_called_once()
    
    async def test_request_otp_user_not_found(self, mock_db_session, mock_user_repo):
        """تست کاربر ناموجود."""
        mock_user_repo.get_by_email.return_value = None
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="یافت نشد"):
                await auth_service.request_otp(
                    mock_db_session,
                    "notfound@example.com"
                )
    
    async def test_request_otp_inactive_user(self, mock_db_session, mock_user_repo):
        """تست کاربر غیرفعال."""
        mock_user = User(
            id=1,
            email="test@example.com",
            is_active=False,
            email_verified=True
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="غیرفعال"):
                await auth_service.request_otp(
                    mock_db_session,
                    "test@example.com"
                )
    
    async def test_request_otp_unverified_email(self, mock_db_session, mock_user_repo):
        """تست ایمیل تایید نشده."""
        mock_user = User(
            id=1,
            email="test@example.com",
            is_active=True,
            email_verified=False
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="تایید کنید"):
                await auth_service.request_otp(
                    mock_db_session,
                    "test@example.com"
                )


@pytest.mark.asyncio
class TestVerifyOTP:
    """Tests for verify_otp function."""
    
    async def test_verify_otp_success(self, mock_db_session, mock_user_repo, mock_log_service):
        """تست تایید OTP موفق."""
        mock_user = User(
            id=1,
            email="test@example.com",
            is_active=True,
            email_verified=True,
            otp_code="123456",
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with patch('app.services.auth_service.log_service', mock_log_service):
                user = await auth_service.verify_otp(
                    mock_db_session,
                    "test@example.com",
                    "123456"
                )
        
        assert user.email == "test@example.com"
        mock_user_repo.update_otp.assert_called_once()
    
    async def test_verify_otp_wrong_code(self, mock_db_session, mock_user_repo):
        """تست کد اشتباه."""
        mock_user = User(
            id=1,
            email="test@example.com",
            is_active=True,
            email_verified=True,
            otp_code="123456",
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="نامعتبر"):
                await auth_service.verify_otp(
                    mock_db_session,
                    "test@example.com",
                    "wrong"
                )


@pytest.mark.asyncio
class TestLoginWithPassword:
    """Tests for login_with_password function."""
    
    async def test_login_success(self, mock_db_session, mock_user_repo, mock_log_service):
        """تست ورود موفق با پسورد."""
        from app.core.security import hash_password
        
        mock_user = User(
            id=1,
            email="test@example.com",
            password=hash_password("password123"),
            is_active=True,
            email_verified=True
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with patch('app.services.auth_service.log_service', mock_log_service):
                user = await auth_service.login_with_password(
                    mock_db_session,
                    "test@example.com",
                    "password123"
                )
        
        assert user.email == "test@example.com"
    
    async def test_login_wrong_password(self, mock_db_session, mock_user_repo):
        """تست پسورد اشتباه."""
        from app.core.security import hash_password
        
        mock_user = User(
            id=1,
            email="test@example.com",
            password=hash_password("password123"),
            is_active=True,
            email_verified=True
        )
        mock_user_repo.get_by_email.return_value = mock_user
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="نادرست"):
                await auth_service.login_with_password(
                    mock_db_session,
                    "test@example.com",
                    "wrong_password"
                )
    
    async def test_login_user_not_found(self, mock_db_session, mock_user_repo):
        """تست کاربر ناموجود."""
        mock_user_repo.get_by_email.return_value = None
        
        with patch('app.services.auth_service.user_repo', mock_user_repo):
            with pytest.raises(ValueError, match="نادرست"):
                await auth_service.login_with_password(
                    mock_db_session,
                    "notfound@example.com",
                    "password123"
                )

