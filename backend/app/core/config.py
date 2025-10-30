from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import EmailStr


class Settings(BaseSettings):
    APP_NAME: str = "Passenger Freight MVP"

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

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()

