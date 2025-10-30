from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import EmailStr, Field


class Settings(BaseSettings):
    """تنظیمات اپلیکیشن با Pydantic Settings."""
    
    APP_NAME: str = "Passenger Freight MVP"
    DEBUG: bool = False
    
    # Security & JWT
    SECRET_KEY: str = Field(
        default="dev-secret-key-CHANGE-IN-PRODUCTION-min-32-chars",
        description="کلید مخفی برای امضای JWT و OTP (حداقل 32 کاراکتر)"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OTP
    OTP_EXPIRY_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="لیست domainهای مجاز برای CORS"
    )
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # DB/Redis (در گام‌های بعدی استفاده می‌شوند)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@db:5432/app"
    REDIS_URL: str = "redis://redis:6379/0"

    # Email (dev با MailHog)
    SMTP_HOST: str = "mailhog"
    SMTP_PORT: int = 1025
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    EMAIL_FROM: EmailStr | str = "no-reply@example.local"

    # Rate limit
    MESSAGES_PER_DAY: int = 5
    API_RATE_LIMIT_PER_MINUTE: int = 100

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()

