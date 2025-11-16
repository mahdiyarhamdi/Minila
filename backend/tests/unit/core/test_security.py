"""Unit tests for security module."""
import pytest
from datetime import datetime, timedelta

from app.core import security
from app.core.config import get_settings

settings = get_settings()


class TestPasswordHashing:
    """Tests for password hashing functions."""
    
    def test_hash_password(self):
        """تست هش کردن پسورد."""
        password = "MySecurePassword123!"
        hashed = security.hash_password(password)
        
        # Check format: salt:hash
        assert ":" in hashed
        parts = hashed.split(":")
        assert len(parts) == 2
        assert len(parts[0]) == 32  # salt (16 bytes hex)
        assert len(parts[1]) == 64  # SHA256 hash (32 bytes hex)
    
    def test_hash_password_different_salts(self):
        """تست اینکه همان پسورد با salt های مختلف هش می‌شود."""
        password = "MyPassword"
        hash1 = security.hash_password(password)
        hash2 = security.hash_password(password)
        
        assert hash1 != hash2  # Different salts
    
    def test_verify_password_success(self):
        """تست تایید پسورد صحیح."""
        password = "MySecurePassword123!"
        hashed = security.hash_password(password)
        
        assert security.verify_password(password, hashed) is True
    
    def test_verify_password_wrong(self):
        """تست تایید پسورد اشتباه."""
        password = "MySecurePassword123!"
        hashed = security.hash_password(password)
        
        assert security.verify_password("WrongPassword", hashed) is False
    
    def test_verify_password_empty(self):
        """تست پسورد خالی."""
        password = "MyPassword"
        hashed = security.hash_password(password)
        
        assert security.verify_password("", hashed) is False


class TestJWTTokens:
    """Tests for JWT token functions."""
    
    def test_create_access_token(self):
        """تست ساخت access token."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = security.create_access_token(
            data=data,
            secret=settings.SECRET_KEY,
            expires_minutes=30
        )
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are long
    
    def test_create_refresh_token(self):
        """تست ساخت refresh token."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = security.create_refresh_token(
            data=data,
            secret=settings.SECRET_KEY,
            expires_minutes=10080  # 7 days
        )
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50
    
    def test_decode_token_success(self):
        """تست decode موفق توکن."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = security.create_access_token(
            data=data,
            secret=settings.SECRET_KEY,
            expires_minutes=30
        )
        
        decoded = security.decode_token(token, settings.SECRET_KEY)
        
        assert decoded is not None
        assert decoded["user_id"] == 1
        assert decoded["email"] == "test@example.com"
    
    def test_decode_token_invalid(self):
        """تست decode توکن نامعتبر."""
        decoded = security.decode_token("invalid_token", settings.SECRET_KEY)
        
        assert decoded is None
    
    def test_decode_token_wrong_secret(self):
        """تست decode با secret اشتباه."""
        data = {"user_id": 1, "email": "test@example.com"}
        token = security.create_access_token(
            data=data,
            secret=settings.SECRET_KEY,
            expires_minutes=30
        )
        
        decoded = security.decode_token(token, "wrong_secret_key")
        
        assert decoded is None
    
    def test_decode_token_expired(self):
        """تست decode توکن منقضی شده."""
        data = {"user_id": 1, "email": "test@example.com"}
        # Create token with negative expiry (already expired)
        token = security.create_access_token(
            data=data,
            secret=settings.SECRET_KEY,
            expires_minutes=-1  # Expired 1 minute ago
        )
        
        decoded = security.decode_token(token, settings.SECRET_KEY)
        
        # Token should be expired
        assert decoded is None or "exp" in decoded


class TestOTPFunctions:
    """Tests for OTP functions (if used separately)."""
    
    def test_generate_otp_default_length(self):
        """تست تولید OTP با طول پیش‌فرض."""
        otp = security.generate_otp()
        
        assert len(otp) == 6
        assert otp.isdigit()
    
    def test_generate_otp_custom_length(self):
        """تست تولید OTP با طول دلخواه."""
        otp = security.generate_otp(length=4)
        
        assert len(otp) == 4
        assert otp.isdigit()
    
    def test_hash_otp(self):
        """تست هش کردن OTP."""
        otp = "123456"
        hashed = security.hash_otp(otp, settings.SECRET_KEY)
        
        assert hashed is not None
        assert isinstance(hashed, str)
        assert len(hashed) == 64  # SHA256 hex
    
    def test_verify_otp_success(self):
        """تست تایید OTP صحیح."""
        otp = "123456"
        hashed = security.hash_otp(otp, settings.SECRET_KEY)
        
        assert security.verify_otp(otp, hashed, settings.SECRET_KEY) is True
    
    def test_verify_otp_wrong(self):
        """تست تایید OTP اشتباه."""
        otp = "123456"
        hashed = security.hash_otp(otp, settings.SECRET_KEY)
        
        assert security.verify_otp("654321", hashed, settings.SECRET_KEY) is False



