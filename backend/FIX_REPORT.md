# گزارش رفع باگ‌های تست Backend - تلاش سوم

**تاریخ**: 2025-11-02  
**مدت**: ~1 ساعت  
**وضعیت**: ✅ **Partial Fix** - بهبود جزئی (+2 passed tests)

---

## 📊 خلاصه نتایج

### نتایج نهایی
```
✅ 30/93 PASSED (32%)  ← بهبود از 28 (30%)
❌ 20 FAILED (21.5%)   ← ثابت
🔴 43 ERRORS (46.5%)   ← ثابت
⏱️ Duration: ~10 seconds
```

### مقایسه با تلاش قبلی

| Metric | قبل از تلاش سوم | بعد از تلاش سوم | تغییر |
|--------|----------------|-----------------|-------|
| **PASSED** | 28 (30%) | 30 (32%) | **+2** ✅ |
| **FAILED** | 22 (24%) | 20 (21%) | **-2** ✅ |
| **ERRORS** | 43 (46%) | 43 (46%) | 0 |

**نتیجه**: بهبود جزئی - 2 تست بیشتر pass شدند

---

## 🔧 تغییرات اعمال شده

### 1. حذف Wrapper Function در `deps.get_db` ✅

**فایل**: `backend/app/api/deps.py`

**قبل**:
```python
async def get_db() -> AsyncGenerator:
    from ..core.database import get_db as _get_db
    async for session in _get_db():
        yield session

DBSession = Annotated[AsyncSession, Depends(get_db)]
```

**بعد**:
```python
from ..core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

DBSession = Annotated[AsyncSession, Depends(get_db)]
```

**دلیل**: 
- حذف لایه wrapper که باعث می‌شد dependency override در تست‌ها کار نکند
- استفاده مستقیم از `core.database.get_db`
- حالا `deps.get_db` و `database.get_db` دقیقاً همان object هستند

**نتیجه**: +2 passed tests ✅

---

### 2. بهبود Test Session Strategy ⚠️

**فایل**: `backend/tests/conftest.py`

**تغییرات**:
- استفاده از real commits به جای transaction rollback
- حذف transaction wrapper از `test_db` fixture
- Monkey-patching `database.engine` و `database.AsyncSessionLocal` در `client` fixture

**کد**:
```python
@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
    
    # ایجاد session معمولی بدون transaction wrapper
    session = TestSessionLocal()
    
    try:
        yield session
    finally:
        await session.close()
        # Drop tables after test
        async with test_engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.drop_all)
```

**نتیجه**: Session isolation همچنان حل نشده ⚠️

---

### 3. Monkey-Patch Database Engine در Client Fixture 🔄

**استراتژی**: جایگزینی موقت production engine با test engine

```python
@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession):
    from app.core import database
    
    # ذخیره production engine
    original_engine = database.engine
    original_session_factory = database.AsyncSessionLocal
    
    # جایگزینی با test engine
    database.engine = test_engine
    database.AsyncSessionLocal = TestSessionLocal
    
    try:
        async with AsyncClient(...) as ac:
            yield ac
    finally:
        # بازگرداندن production engine
        database.engine = original_engine
        database.AsyncSessionLocal = original_session_factory
        app.dependency_overrides.clear()
```

**نتیجه**: تأثیر محدود، session isolation همچنان باقی است ⚠️

---

## ❌ مشکلات باقیمانده

### 1. Session Isolation (مشکل اصلی) 🔴

**علائم**:
- API calls همچنان 404 Not Found برای test users می‌دهند
- Foreign key violations در card و community tests
- Test fixtures data را commit می‌کنند اما API آن را نمی‌بیند

**مثال خطا**:
```
FAILED test_get_profile_success - assert 404 == 200
```

**تحلیل**:
حتی با monkey-patching engine، به نظر می‌رسد هر API call یک session جدید می‌سازد که test data را نمی‌بیند. این احتمالاً به دلیل یکی از موارد زیر است:
1. Transaction isolation level در PostgreSQL
2. Session factory caching
3. Connection pooling issues

---

### 2. Missing Seed Data (Roles & Locations) 🔴

تست‌های کارت و کامیونیتی به `seed_roles` و `seed_locations` نیاز دارند که در DB موجود نیستند:

```
ERROR: NoResultFound: No row was found when one was required
```

**دلیل**: seed fixtures data را commit می‌کنند اما API session ها آن را نمی‌بینند.

---

### 3. Rate Limiter Errors (جزئی) ⚠️

برخی message tests همچنان خطای rate limiter می‌دهند:
```
ERROR: RuntimeError: Rate limiter not initialized
```

**دلیل**: Mock rate limiter در برخی test scenarios کار نمی‌کند.

---

## 🎯 راه‌حل‌های پیشنهادی برای رفع کامل

### گزینه 1: استفاده از READ UNCOMMITTED Isolation Level ⭐⭐⭐

تغییر isolation level به `READ UNCOMMITTED` تا uncommitted data هم visible باشد:

```python
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
    isolation_level="READ UNCOMMITTED"  # ← اضافه شود
)
```

**مزیت**: ساده‌ترین راه‌حل  
**معایب**: فقط در PostgreSQL 9.1+ کار می‌کند، ممکن است edge cases داشته باشد

---

### گزینه 2: استفاده از Nested Transactions با SAVEPOINT ⭐⭐

```python
@pytest_asyncio.fixture(scope="function")
async def test_db():
    async with test_engine.connect() as connection:
        trans = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False, join_transaction_mode="create_savepoint")
        
        yield session
        
        await trans.rollback()
```

**مزیت**: همه تست‌ها در یک transaction ماندگار هستند  
**معایب**: پیچیده‌تر، ممکن است با برخی queries سازگار نباشد

---

### گزینه 3: Shared Connection Pool ⭐

ایجاد یک connection pool مشترک برای همه fixtures و API calls:

```python
_shared_connection = None

@pytest_asyncio.fixture(scope="session")
async def shared_connection():
    global _shared_connection
    _shared_connection = await test_engine.connect()
    yield _shared_connection
    await _shared_connection.close()
```

**مزیت**: همه از یک connection استفاده می‌کنند  
**معایب**: نیاز به refactor گسترده

---

### گزینه 4: بازنویسی کامل Test Infrastructure ⭐⭐⭐⭐

1. حذف transaction rollback strategy
2. استفاده از real DB commits برای همه fixtures
3. Cleanup با `DELETE` queries به جای `drop_all`
4. استفاده از test database واقعی که persist شود
5. استفاده از factories برای test data generation

**مزیت**: پایدارترین راه‌حل، مطابق با best practices  
**معایب**: زمان‌بر (~4-6 ساعت)

---

## 📝 تست‌هایی که Pass شدند (جدید) ✅

2 تست جدید pass شدند پس از حذف wrapper:

1. یکی از تست‌های auth (احتمالاً مربوط به token validation)
2. یکی از تست‌های دیگر (نیاز به بررسی دقیق‌تر)

---

## 🔍 تست‌های باقیمانده که Fail هستند

### Auth Tests (4 failed)
- `test_signup_success` - 400 به جای 201
- `test_verify_otp_success` - TypeError
- `test_verify_otp_used_code` - TypeError  
- `test_refresh_token_success` - خطای نامشخص

### User Tests (6 failed)
- `test_get_profile_success` - 404 (user not found)
- `test_update_profile_*` (5 tests) - همه 404

### Card Tests (4 failed)
- `test_get_cards_filter_is_sender_true` - FK violation or no data
- `test_create_passenger_card_success` - FK violation (location)
- `test_create_sender_card_success` - FK violation (location)
- `test_delete_card_by_owner` - FK violation

### Community Tests (3 failed)
- `test_create_community_success` - No role found
- `test_join_community_not_found` - مشکل session
- `test_get_members_not_found` - مشکل session

### Message Tests (3 failed)
- `test_send_message_validation_error_*` (2 tests) - Rate limiter
- `test_send_message_to_nonexistent_user` - Rate limiter

---

## 💡 نتیجه‌گیری

### آنچه موفق شد ✅
- حذف wrapper function در `deps.py` → بهبود dependency injection
- +2 تست pass شدند
- معماری کلی بهتر شد (کد ساده‌تر و قابل نگهداری‌تر)

### آنچه همچنان نیاز به کار دارد ⚠️
- Session isolation: مشکل اصلی که باعث 404 errors می‌شود
- Seed data visibility: roles و locations در API visible نیستند
- Rate limiter mocking: برخی test scenarios پوشش داده نمی‌شوند

### توصیه نهایی 🎯

برای رسیدن به 75%+ pass rate، یکی از گزینه‌های زیر را پیشنهاد می‌کنم:

1. **کوتاه‌مدت (1-2 ساعت)**: گزینه 1 (isolation level) + فیکس rate limiter  
   **نتیجه پیش‌بینی**: ~50-60% pass rate

2. **میان‌مدت (4-6 ساعت)**: گزینه 4 (بازنویسی کامل)  
   **نتیجه پیش‌بینی**: ~75-85% pass rate

تغییری که در این تلاش انجام دادیم (حذف wrapper) یک بهبود معماری مثبت بود و باید نگهداشته شود، اما برای رفع کامل مشکلات تست، نیاز به یک تلاش بزرگ‌تر برای refactor test infrastructure داریم.

---

**تاریخ گزارش**: 2025-11-02 20:32 UTC+4  
**نسخه**: 1.0  
**وضعیت**: Partial success - نیاز به ادامه کار

