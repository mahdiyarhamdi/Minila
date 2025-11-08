"""Security utilities: OTP, JWT, password hashing."""
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Optional, Dict
import hashlib
import hmac
import json
import base64
import re


def generate_otp(length: int = 6) -> str:
    """تولید OTP عددی تصادفی.
    
    Args:
        length: طول OTP (پیش‌فرض 6 رقم)
        
    Returns:
        رشته عددی تصادفی
    """
    return "".join(secrets.choice(string.digits) for _ in range(length))


def hash_otp(otp: str, secret: str) -> str:
    """هش کردن OTP با HMAC-SHA256.
    
    Args:
        otp: کد OTP
        secret: کلید مخفی
        
    Returns:
        هش شده OTP
    """
    return hmac.new(
        secret.encode(),
        otp.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_otp(otp: str, hashed_otp: str, secret: str) -> bool:
    """تایید OTP.
    
    Args:
        otp: کد OTP ورودی
        hashed_otp: هش شده OTP ذخیره شده
        secret: کلید مخفی
        
    Returns:
        True اگر صحیح باشد
    """
    return hmac.compare_digest(hash_otp(otp, secret), hashed_otp)


def hash_password(password: str) -> str:
    """هش کردن پسورد با SHA256 و salt.
    
    Note: برای production از bcrypt/argon2 استفاده کنید.
    این پیاده‌سازی ساده برای MVP است.
    
    Args:
        password: پسورد خام
        
    Returns:
        رشته salt:hash
    """
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"


def verify_password(password: str, hashed_password: str) -> bool:
    """تایید پسورد.
    
    Args:
        password: پسورد ورودی
        hashed_password: هش شده پسورد (salt:hash)
        
    Returns:
        True اگر صحیح باشد
    """
    try:
        salt, pwd_hash = hashed_password.split(":", 1)
        new_hash = hashlib.sha256((salt + password).encode()).hexdigest()
        return hmac.compare_digest(new_hash, pwd_hash)
    except ValueError:
        return False


def create_token(data: Dict[str, Any], secret: str, expires_minutes: int = 60) -> str:
    """تولید JWT-like token ساده.
    
    Note: برای production از python-jose یا pyjwt استفاده کنید.
    این پیاده‌سازی ساده برای MVP بدون وابستگی خارجی است.
    
    Args:
        data: دیتای payload
        secret: کلید مخفی
        expires_minutes: زمان انقضا به دقیقه
        
    Returns:
        توکن رمزشده
    """
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload["exp"] = expire.timestamp()
    
    # Encode payload
    payload_json = json.dumps(payload, sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()
    
    # Create signature
    signature = hmac.new(
        secret.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload_b64}.{signature}"


def create_access_token(data: Dict[str, Any], secret: str, expires_minutes: int = 1440) -> str:
    """تولید Access Token.
    
    Args:
        data: دیتای payload
        secret: کلید مخفی
        expires_minutes: زمان انقضا (پیش‌فرض 24 ساعت)
        
    Returns:
        access token
    """
    return create_token(data, secret, expires_minutes)


def create_refresh_token(data: Dict[str, Any], secret: str, expires_minutes: int = 10080) -> str:
    """تولید Refresh Token.
    
    Args:
        data: دیتای payload
        secret: کلید مخفی
        expires_minutes: زمان انقضا (پیش‌فرض 7 روز)
        
    Returns:
        refresh token
    """
    return create_token(data, secret, expires_minutes)


def decode_token(token: str, secret: str) -> Optional[Dict[str, Any]]:
    """Decode و تایید token.
    
    Args:
        token: توکن رمزشده
        secret: کلید مخفی
        
    Returns:
        payload دیکشنری یا None در صورت خطا
    """
    try:
        payload_b64, signature = token.split(".", 1)
        
        # Verify signature
        expected_sig = hmac.new(
            secret.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            return None
        
        # Decode payload
        payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        payload = json.loads(payload_json)
        
        # Check expiration
        if "exp" in payload:
            if datetime.utcnow().timestamp() > payload["exp"]:
                return None
        
        return payload
    except (ValueError, KeyError, json.JSONDecodeError):
        return None


def generate_secure_string(length: int = 32) -> str:
    """تولید رشته تصادفی امن.
    
    Args:
        length: طول رشته
        
    Returns:
        رشته تصادفی hex
    """
    return secrets.token_hex(length // 2)


def validate_email(email: str) -> bool:
    """تایید فرمت ایمیل.
    
    Args:
        email: آدرس ایمیل
        
    Returns:
        True اگر فرمت صحیح باشد
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

