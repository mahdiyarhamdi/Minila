"""Pytest configuration and fixtures for comprehensive testing."""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import redis.asyncio as aioredis

from app.main import app
from app.core.config import get_settings
from app.models.base import BaseModel
from app.core.security import create_access_token


# Test database URL (PostgreSQL test container)
# استفاده از localhost برای اجرای تست‌ها خارج از Docker
# Port 5433 برای test database و Port 6380 برای test Redis
import os
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5433/minila_test"
)
TEST_REDIS_URL = os.environ.get(
    "TEST_REDIS_URL", 
    "redis://localhost:6380/0"
)

settings = get_settings()

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


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test with real commits.
    
    استراتژی: استفاده از real commits به جای transaction rollback
    تا data برای همه sessions visible باشد.
    
    Yields:
        AsyncSession: Test database session
    """
    from sqlalchemy import text
    
    # Completely drop and recreate the public schema for a clean slate
    async with test_engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    
    # Create tables with checkfirst=True to avoid duplicate errors
    async with test_engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: BaseModel.metadata.create_all(sync_conn, checkfirst=True))
    
    # ایجاد session معمولی بدون transaction wrapper
    session = TestSessionLocal()
    
    try:
        yield session
    finally:
        # Close session
        await session.close()
        
        # Drop tables after test (cleanup)
        async with test_engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def seed_roles(test_db: AsyncSession) -> dict:
    """Create minimal Role data for membership tests."""
    from app.models.role import Role
    
    # Create standard roles
    member_role = Role(id=1, name="member")
    manager_role = Role(id=2, name="manager")
    owner_role = Role(id=3, name="owner")
    
    test_db.add_all([member_role, manager_role, owner_role])
    await test_db.commit()
    
    return {
        "member": member_role.id,
        "manager": manager_role.id,
        "owner": owner_role.id
    }


@pytest_asyncio.fixture(scope="function")
async def seed_locations(test_db: AsyncSession) -> dict:
    """Create minimal Country and City data for card tests."""
    from app.models.location import Country, City
    
    # Create countries with all required fields
    country1 = Country(
        id=1, 
        name="Test Country 1",
        name_en="Test Country 1",
        name_fa="کشور تست 1",
        name_ar="دولة الاختبار 1"
    )
    country2 = Country(
        id=2, 
        name="Test Country 2",
        name_en="Test Country 2",
        name_fa="کشور تست 2",
        name_ar="دولة الاختبار 2"
    )
    test_db.add_all([country1, country2])
    await test_db.flush()
    
    # Create cities with all required fields
    city1 = City(
        id=1, 
        name="Test City 1", 
        name_en="Test City 1",
        name_fa="شهر تست 1",
        name_ar="مدينة الاختبار 1",
        country_id=1
    )
    city2 = City(
        id=2, 
        name="Test City 2",
        name_en="Test City 2",
        name_fa="شهر تست 2",
        name_ar="مدينة الاختبار 2",
        country_id=2
    )
    test_db.add_all([city1, city2])
    await test_db.commit()
    
    return {
        "countries": [country1, country2],
        "cities": [city1, city2]
    }


@pytest_asyncio.fixture(scope="function")
async def redis_client() -> AsyncGenerator[aioredis.Redis, None]:
    """Create Redis client for rate limiting tests.
    
    Yields:
        Redis client connected to test instance
    """
    from app.api import deps
    from app.core import rate_limit
    
    # Remove rate limiter overrides to enable real rate limiting
    overrides_backup = {}
    if deps.verify_message_rate_limit in app.dependency_overrides:
        overrides_backup['message'] = app.dependency_overrides[deps.verify_message_rate_limit]
        del app.dependency_overrides[deps.verify_message_rate_limit]
    if deps.verify_api_rate_limit in app.dependency_overrides:
        overrides_backup['api'] = app.dependency_overrides[deps.verify_api_rate_limit]
        del app.dependency_overrides[deps.verify_api_rate_limit]
    
    client = aioredis.from_url(TEST_REDIS_URL, decode_responses=True)
    
    # Initialize rate limiter for this test
    rate_limit.init_rate_limiter(TEST_REDIS_URL)
    
    yield client
    
    # Cleanup: remove all test keys
    keys = await client.keys("*")
    if keys:
        await client.delete(*keys)
    
    await client.close()
    
    # Restore overrides
    if 'message' in overrides_backup:
        app.dependency_overrides[deps.verify_message_rate_limit] = overrides_backup['message']
    if 'api' in overrides_backup:
        app.dependency_overrides[deps.verify_api_rate_limit] = overrides_backup['api']


@pytest.fixture(scope="session", autouse=True)
def mock_rate_limiter():
    """Mock rate limiter برای تست‌ها تا از initialize کردن Redis واقعی اجتناب شود.
    
    این fixture به صورت خودکار برای همه تست‌ها اجرا می‌شود و
    rate limit dependencies را override می‌کند.
    
    Yields:
        None
    """
    from app.api import deps
    from fastapi import Request
    
    # Mock rate limit dependencies - همیشه pass می‌کنند
    async def mock_message_rate_limit(request: Request) -> None:
        pass
    
    async def mock_api_rate_limit(request: Request) -> None:
        pass
    
    # Override dependencies
    app.dependency_overrides[deps.verify_message_rate_limit] = mock_message_rate_limit
    app.dependency_overrides[deps.verify_api_rate_limit] = mock_api_rate_limit
    
    yield
    
    # Cleanup
    if deps.verify_message_rate_limit in app.dependency_overrides:
        del app.dependency_overrides[deps.verify_message_rate_limit]
    if deps.verify_api_rate_limit in app.dependency_overrides:
        del app.dependency_overrides[deps.verify_api_rate_limit]


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with monkey-patched database engine.
    
    Args:
        test_db: Test database session (فقط برای dependency resolution)
        
    Yields:
        AsyncClient: Test HTTP client
    """
    # Monkey-patch استراتژی: production engine را با test engine جایگزین می‌کنیم
    from app.core import database
    from app.api import deps
    
    # ذخیره production engine
    original_engine = database.engine
    original_session_factory = database.AsyncSessionLocal
    
    # جایگزینی با test engine
    database.engine = test_engine
    database.AsyncSessionLocal = TestSessionLocal
    
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as ac:
            yield ac
    finally:
        # بازگرداندن production engine
        database.engine = original_engine
        database.AsyncSessionLocal = original_session_factory
        
        # Don't clear dependency overrides - mock_rate_limiter باید باقی بماند


# ==================== User Fixtures ====================

@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> dict:
    """Create a test user with JWT token.
    
    Args:
        test_db: Test database session
        
    Returns:
        dict: User data with token and plain password
    """
    from app.models.user import User
    from app.core.security import hash_password
    
    plain_password = "TestPass123!"
    
    user = User(
        email="testuser@example.com",
        password=hash_password(plain_password),
        first_name="Test",
        last_name="User",
        email_verified=True,
        is_active=True,
        is_admin=False
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    # Generate token
    token = create_access_token(
        {"user_id": user.id, "email": user.email},
        settings.SECRET_KEY,
        settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "password": plain_password  # For testing password change
    }


@pytest_asyncio.fixture
async def test_user2(test_db: AsyncSession) -> dict:
    """Create a second test user for messaging tests.
    
    Args:
        test_db: Test database session
        
    Returns:
        dict: User data with token and plain password
    """
    from app.models.user import User
    from app.core.security import hash_password
    
    plain_password = "TestPass123!"
    
    user = User(
        email="testuser2@example.com",
        password=hash_password(plain_password),
        first_name="Test2",
        last_name="User2",
        email_verified=True,
        is_active=True,
        is_admin=False
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    # Generate token
    token = create_access_token(
        {"user_id": user.id, "email": user.email},
        settings.SECRET_KEY,
        settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "password": plain_password  # For testing password change
    }


@pytest_asyncio.fixture
async def test_admin(test_db: AsyncSession) -> dict:
    """Create an admin user with JWT token.
    
    Args:
        test_db: Test database session
        
    Returns:
        dict: Admin user data with token and plain password
    """
    from app.models.user import User
    from app.core.security import hash_password
    
    plain_password = "AdminPass123!"
    
    user = User(
        email="admin@example.com",
        password=hash_password(plain_password),
        first_name="Admin",
        last_name="User",
        email_verified=True,
        is_active=True,
        is_admin=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    # Generate token
    token = create_access_token(
        {"user_id": user.id, "email": user.email},
        settings.SECRET_KEY,
        settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "is_admin": True,
        "password": plain_password  # For testing password change
    }


# ==================== Community Fixtures ====================

@pytest_asyncio.fixture
async def test_community(test_db: AsyncSession, test_user: dict, seed_roles: dict) -> dict:
    """Create a test community with owner.
    
    Args:
        test_db: Test database session
        test_user: Test user (will be owner)
        seed_roles: Seeded role data
        
    Returns:
        dict: Community data
    """
    from app.models.community import Community
    from app.models.membership import Membership
    
    community = Community(
        name="Test Community",
        slug="test_community",
        bio="A test community for unit tests",
        owner_id=test_user["user_id"]
    )
    test_db.add(community)
    await test_db.commit()
    await test_db.refresh(community)
    
    # Create membership for owner
    membership = Membership(
        user_id=test_user["user_id"],
        community_id=community.id,
        role_id=seed_roles["owner"],
        is_active=True
    )
    test_db.add(membership)
    await test_db.commit()
    
    return {
        "id": community.id,
        "name": community.name,
        "slug": community.slug,
        "bio": community.bio,
        "owner_id": community.owner_id
    }


@pytest_asyncio.fixture
async def test_community2(test_db: AsyncSession, test_user2: dict, seed_roles: dict) -> dict:
    """Create a second test community with different owner.
    
    Args:
        test_db: Test database session
        test_user2: Second test user (will be owner)
        seed_roles: Seeded role data
        
    Returns:
        dict: Community data
    """
    from app.models.community import Community
    from app.models.membership import Membership
    
    community = Community(
        name="Test Community 2",
        slug="test_community_2",
        bio="A second test community",
        owner_id=test_user2["user_id"]
    )
    test_db.add(community)
    await test_db.commit()
    await test_db.refresh(community)
    
    # Create membership for owner
    membership = Membership(
        user_id=test_user2["user_id"],
        community_id=community.id,
        role_id=seed_roles["owner"],
        is_active=True
    )
    test_db.add(membership)
    await test_db.commit()
    
    return {
        "id": community.id,
        "name": community.name,
        "slug": community.slug,
        "bio": community.bio,
        "owner_id": community.owner_id
    }


@pytest_asyncio.fixture
async def test_membership(
    test_db: AsyncSession, 
    test_user2: dict, 
    test_community: dict,
    seed_roles: dict
) -> dict:
    """Create a test membership (user2 as member in community1).
    
    Args:
        test_db: Test database session
        test_user2: Second test user
        test_community: First test community
        seed_roles: Seeded role data
        
    Returns:
        dict: Membership data
    """
    from app.models.membership import Membership
    
    membership = Membership(
        user_id=test_user2["user_id"],
        community_id=test_community["id"],
        role_id=seed_roles["member"],
        is_active=True
    )
    test_db.add(membership)
    await test_db.commit()
    await test_db.refresh(membership)
    
    return {
        "id": membership.id,
        "user_id": membership.user_id,
        "community_id": membership.community_id,
        "role_id": membership.role_id
    }


# ==================== Card Fixtures ====================

@pytest_asyncio.fixture
async def test_card(test_db: AsyncSession, test_user: dict, seed_locations: dict) -> dict:
    """Create a test card.
    
    Args:
        test_db: Test database session
        test_user: Card owner
        seed_locations: Seeded location data
        
    Returns:
        dict: Card data
    """
    from app.models.card import Card
    from datetime import datetime, timedelta
    
    card = Card(
        owner_id=test_user["user_id"],
        is_sender=False,
        origin_country_id=1,
        origin_city_id=1,
        destination_country_id=2,
        destination_city_id=2,
        ticket_date_time=datetime.utcnow() + timedelta(days=7),
        weight=5.0,
        description="Test card for unit tests"
    )
    test_db.add(card)
    await test_db.commit()
    await test_db.refresh(card)
    
    return {
        "id": card.id,
        "owner_id": card.owner_id,
        "is_sender": card.is_sender,
        "weight": card.weight,
        "description": card.description
    }


# ==================== Helper Fixtures ====================

@pytest.fixture
def auth_headers(test_user: dict) -> dict:
    """Generate authorization headers for test user.
    
    Args:
        test_user: Test user with token
        
    Returns:
        dict: Authorization headers
    """
    return {"Authorization": f"Bearer {test_user['token']}"}


@pytest.fixture
def auth_headers_user2(test_user2: dict) -> dict:
    """Generate authorization headers for second test user.
    
    Args:
        test_user2: Second test user with token
        
    Returns:
        dict: Authorization headers
    """
    return {"Authorization": f"Bearer {test_user2['token']}"}


# ==================== Mock Fixtures for Unit Tests ====================

@pytest.fixture
def mock_db_session():
    """Mock AsyncSession برای unit tests.
    
    Returns:
        AsyncMock: Mock database session
    """
    session = AsyncMock(spec=AsyncSession)
    session.commit = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.add = MagicMock()
    session.add_all = MagicMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def mock_user_repo():
    """Mock user repository برای service tests.
    
    Returns:
        MagicMock: Mock user repository module
    """
    repo = MagicMock()
    repo.get_by_email = AsyncMock()
    repo.get_by_id = AsyncMock()
    repo.email_exists = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.update_otp = AsyncMock()
    repo.set_email_verified = AsyncMock()
    return repo


@pytest.fixture
def mock_community_repo():
    """Mock community repository برای service tests.
    
    Returns:
        MagicMock: Mock community repository module
    """
    repo = MagicMock()
    repo.get_all = AsyncMock()
    repo.get_by_id = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    repo.check_common_membership = AsyncMock()
    return repo


@pytest.fixture
def mock_message_repo():
    """Mock message repository برای service tests.
    
    Returns:
        MagicMock: Mock message repository module
    """
    repo = MagicMock()
    repo.create = AsyncMock()
    repo.get_inbox = AsyncMock()
    repo.get_sent = AsyncMock()
    return repo


@pytest.fixture
def mock_card_repo():
    """Mock card repository برای service tests.
    
    Returns:
        MagicMock: Mock card repository module
    """
    repo = MagicMock()
    repo.get_all = AsyncMock()
    repo.get_by_id = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    return repo


@pytest.fixture
def mock_log_service():
    """Mock log service برای تست‌های دیگر.
    
    Returns:
        MagicMock: Mock log service module
    """
    service = MagicMock()
    service.log_event = AsyncMock()
    return service


@pytest.fixture
def mock_email_functions():
    """Mock email sending functions.
    
    Returns:
        dict: Dictionary of mocked email functions
    """
    return {
        'send_otp_email': MagicMock(),
        'send_membership_request_notification': MagicMock(),
        'send_membership_result': MagicMock(),
        'send_message_notification': MagicMock()
    }
