"""Pytest configuration and fixtures."""
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import get_db
from app.models.base import BaseModel


# Test database URL (in-memory SQLite for faster tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test.
    
    Yields:
        AsyncSession: Test database session
    """
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
    
    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database override.
    
    Args:
        test_db: Test database session
        
    Yields:
        AsyncClient: Test HTTP client
    """
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def event_loop():
    """Create an instance of the event loop for each test."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_user_data() -> dict:
    """Sample user data for testing.
    
    Returns:
        dict: User data
    """
    return {
        "email": "test@example.com",
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
async def test_community_data() -> dict:
    """Sample community data for testing.
    
    Returns:
        dict: Community data
    """
    return {
        "name": "Test Community",
        "bio": "A test community for unit tests"
    }


@pytest.fixture
async def test_card_data() -> dict:
    """Sample card data for testing.
    
    Returns:
        dict: Card data
    """
    return {
        "is_sender": False,
        "origin_country_id": 1,
        "origin_city_id": 1,
        "destination_country_id": 2,
        "destination_city_id": 2,
        "ticket_date_time": "2024-12-01T10:00:00",
        "weight": 5.0,
        "description": "Test card for unit tests"
    }

