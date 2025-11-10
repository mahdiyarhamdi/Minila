"""Tests for password authentication and email verification."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password


class TestEmailVerification:
    """تست‌های تایید ایمیل"""
    
    @pytest.mark.asyncio
    async def test_signup_sends_verification_otp(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: ثبت‌نام باید OTP برای تایید ایمیل ارسال کند"""
        signup_data = {
            "email": "test@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = await client.post("/api/v1/auth/signup", json=signup_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == signup_data["email"]
        assert data["email_verified"] is False
    
    @pytest.mark.asyncio
    async def test_verify_email_with_valid_otp(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: تایید ایمیل با OTP معتبر"""
        # ثبت‌نام
        signup_data = {
            "email": "verify@example.com",
            "password": "TestPass123!",
            "first_name": "Verify",
            "last_name": "Test"
        }
        await client.post("/api/v1/auth/signup", json=signup_data)
        
        # دریافت OTP از دیتابیس (در تست واقعی باید از ایمیل بخوانیم)
        from app.repositories import user_repo
        user = await user_repo.get_by_email(test_db, signup_data["email"])
        otp_code = user.otp_code
        
        # تایید ایمیل
        verify_data = {
            "email": signup_data["email"],
            "otp_code": otp_code
        }
        response = await client.post("/api/v1/auth/verify-email", json=verify_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    @pytest.mark.asyncio
    async def test_verify_email_with_invalid_otp(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: تایید ایمیل با OTP نامعتبر"""
        # ثبت‌نام
        signup_data = {
            "email": "invalid@example.com",
            "password": "TestPass123!",
            "first_name": "Invalid",
            "last_name": "OTP"
        }
        await client.post("/api/v1/auth/signup", json=signup_data)
        
        # تایید با OTP نادرست
        verify_data = {
            "email": signup_data["email"],
            "otp_code": "000000"
        }
        response = await client.post("/api/v1/auth/verify-email", json=verify_data)
        
        assert response.status_code == 400


class TestPasswordLogin:
    """تست‌های ورود با رمز عبور"""
    
    @pytest.mark.asyncio
    async def test_login_with_password_success(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: ورود موفق با رمز عبور"""
        # ایجاد کاربر با ایمیل تایید شده
        from app.repositories import user_repo
        
        password = "TestPass123!"
        hashed = hash_password(password)
        
        user = await user_repo.create(
            test_db,
            email="login@example.com",
            password=hashed,
            first_name="Login",
            last_name="Test",
            email_verified=True
        )
        await test_db.commit()
        
        # ورود با password
        login_data = {
            "email": "login@example.com",
            "password": password
        }
        response = await client.post("/api/v1/auth/login-password", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    @pytest.mark.asyncio
    async def test_login_with_wrong_password(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: ورود با رمز عبور نادرست"""
        # ایجاد کاربر
        from app.repositories import user_repo
        
        password = "CorrectPass123!"
        hashed = hash_password(password)
        
        user = await user_repo.create(
            test_db,
            email="wrong@example.com",
            password=hashed,
            first_name="Wrong",
            last_name="Pass",
            email_verified=True
        )
        await test_db.commit()
        
        # ورود با password نادرست
        login_data = {
            "email": "wrong@example.com",
            "password": "WrongPass123!"
        }
        response = await client.post("/api/v1/auth/login-password", json=login_data)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_login_with_unverified_email(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: ورود با ایمیل تایید نشده"""
        # ایجاد کاربر با email_verified=False
        from app.repositories import user_repo
        
        password = "TestPass123!"
        hashed = hash_password(password)
        
        user = await user_repo.create(
            test_db,
            email="unverified@example.com",
            password=hashed,
            first_name="Unverified",
            last_name="Test",
            email_verified=False
        )
        await test_db.commit()
        
        # ورود
        login_data = {
            "email": "unverified@example.com",
            "password": password
        }
        response = await client.post("/api/v1/auth/login-password", json=login_data)
        
        assert response.status_code == 401  # login_with_password returns 401 for unverified


class TestChangePassword:
    """تست‌های تغییر رمز عبور"""
    
    @pytest.mark.asyncio
    async def test_change_password_success(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: تغییر موفق رمز عبور"""
        # ایجاد کاربر با password
        from app.repositories import user_repo
        from app.core.security import create_access_token
        from app.core.config import get_settings
        
        settings = get_settings()
        old_password = "OldPass123!"
        new_password = "NewPass456!"
        hashed = hash_password(old_password)
        
        user = await user_repo.create(
            test_db,
            email="change@example.com",
            password=hashed,
            first_name="Change",
            last_name="Pass",
            email_verified=True
        )
        await test_db.commit()
        
        # تولید token
        token = create_access_token(
            {"user_id": user.id, "email": user.email},
            settings.SECRET_KEY,
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        headers = {"Authorization": f"Bearer {token}"}
        
        # تغییر password
        change_data = {
            "old_password": old_password,
            "new_password": new_password
        }
        response = await client.put(
            "/api/v1/users/me/password",
            json=change_data,
            headers=headers
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "رمز عبور با موفقیت تغییر کرد"
    
    @pytest.mark.asyncio
    async def test_change_password_wrong_old_password(
        self,
        client: AsyncClient,
        test_db: AsyncSession
    ):
        """تست: تغییر رمز عبور با password قبلی نادرست"""
        # ایجاد کاربر
        from app.repositories import user_repo
        from app.core.security import create_access_token
        from app.core.config import get_settings
        
        settings = get_settings()
        old_password = "OldPass123!"
        hashed = hash_password(old_password)
        
        user = await user_repo.create(
            test_db,
            email="wrongold@example.com",
            password=hashed,
            first_name="Wrong",
            last_name="Old",
            email_verified=True
        )
        await test_db.commit()
        
        # تولید token
        token = create_access_token(
            {"user_id": user.id, "email": user.email},
            settings.SECRET_KEY,
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        headers = {"Authorization": f"Bearer {token}"}
        
        # تغییر password با old_password نادرست
        change_data = {
            "old_password": "WrongOld123!",
            "new_password": "NewPass456!"
        }
        response = await client.put(
            "/api/v1/users/me/password",
            json=change_data,
            headers=headers
        )
        
        assert response.status_code == 400
