# گزارش تلاش دوم: رفع باگ‌های تست Backend Minila

**تاریخ**: 2025-11-02  
**مدت**: ~2 ساعت  
**وضعیت نهایی**: ⚠️ **Partial Fix** - تغییرات اعمال شد اما نتایج همچنان ناکام

---

## 📊 نتایج نهایی

### آمار تست‌ها
```
✅ 28/93 PASSED (30%)
❌ 22 FAILED (24%)  
🔴 43 ERRORS (46%)
⏱️ Duration: ~10 seconds
```

### مقایسه با نتایج قبلی

| Metric | قبل از تلاش | بعد از تلاش | تغییر |
|--------|------------|-------------|-------|
| **PASSED** | 28 (30%) | 28 (30%) | 0 |
| **FAILED** | 22 (24%) | 22 (24%) | 0 |
| **ERRORS** | 43 (46%) | 43 (46%) | 0 |

⚠️ **نتیجه**: تغییرات انجام شده تأثیری بر نتایج تست نداشته است.

---

## 🔧 تغییرات اعمال شده

### 1. تغییر Transaction Strategy ✓

**فایل**: `backend/tests/conftest.py` (خط 53-63)

**تغییر از**:
```python
async with TestSessionLocal() as session:
    yield session
    await session.rollback()
```

**تغییر به**:
```python
session = TestSessionLocal()
try:
    yield session
    if session.in_transaction():
        await session.commit()
finally:
    await session.close()
```

**دلیل**: حذف rollback و استفاده از commit تا test data در DB visible باشد.

---

### 2. Mock Rate Limiter Dependencies ✓

**فایل**: `backend/tests/conftest.py` (خطوط 123-152)

**اضافه شده**:
```python
@pytest.fixture(scope="session", autouse=True)
def mock_rate_limiter():
    """Mock rate limiter برای تست‌ها."""
    from app.api import deps
    
    async def mock_message_rate_limit(request):
        pass
    
    async def mock_api_rate_limit(request):
        pass
    
    app.dependency_overrides[deps.verify_message_rate_limit] = mock_message_rate_limit
    app.dependency_overrides[deps.verify_api_rate_limit] = mock_api_rate_limit
    
    yield
    
    # Cleanup
    if deps.verify_message_rate_limit in app.dependency_overrides:
        del app.dependency_overrides[deps.verify_message_rate_limit]
    if deps.verify_api_rate_limit in app.dependency_overrides:
        del app.dependency_overrides[deps.verify_api_rate_limit]
```

**دلیل**: رفع RuntimeError "Rate limiter not initialized" در تست‌های message.

---

### 3. Override Database Dependencies ✓

**فایل**: `backend/tests/conftest.py` (خطوط 153-183)

**تغییرات**:
```python
@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession):
    from app.api import deps
    from app.core import database
    
    async def override_get_db():
        yield test_db
    
    # Override کردن هر دو deps.get_db و database.get_db
    app.dependency_overrides[deps.get_db] = override_get_db
    app.dependency_overrides[database.get_db] = override_get_db
    
    async with AsyncClient(...) as ac:
        yield ac
    
    # Cleanup
    app.dependency_overrides.pop(deps.get_db, None)
    app.dependency_overrides.pop(database.get_db, None)
```

**دلیل**: اطمینان از اینکه API calls از همان test_db session استفاده کنند.

---

## ❌ مشکلات باقیمانده

### 1. Transaction Isolation همچنان حل نشده 🔴

**شواهد**:
- در لاگ‌ها همچنان `BEGIN (implicit)` جدید دیده می‌شود
- API calls همچنان 404 Not Found برای users می‌دهند
- Foreign key violations همچنان وجود دارند

**مثال خطا**:
```
INFO sqlalchemy.engine.Engine:base.py:2702 BEGIN (implicit)
INFO sqlalchemy.engine.Engine:base.py:1846 SELECT "user"... WHERE "user".id = 1
INFO sqlalchemy.engine.Engine:base.py:1846 [generated in 0.00006s] {'id_1': 1}
INFO sqlalchemy.engine.Engine:base.py:2705 ROLLBACK

FAILED test_get_profile_success - assert 404 == 200
```

**تحلیل**:
API یک transaction جداگانه باز می‌کند و test data را نمی‌بیند، حتی با تمام override هایی که انجام دادیم.

---

### 2. Dependency Override کار نمی‌کند 🔴

**مشکل**:
`app.dependency_overrides` ما کار نمی‌کند چون:
1. `deps.get_db` یک wrapper است که در import time یک reference به `core.database.get_db` می‌گیرد
2. Override کردن `deps.get_db` یا `database.get_db` تأثیری ندارد
3. Monkey patching هم کار نمی‌کند

**کد مشکل‌ساز در `app/api/deps.py`**:
```python
async def get_db() -> AsyncGenerator:
    from ..core.database import get_db as _get_db
    async for session in _get_db():
        yield session
```

---

### 3. Foreign Key Violations 🔴

همچنان خطاهای FK violation وجود دارند:
```
ForeignKeyViolation: insert or update on table "community" violates 
foreign key constraint "community_owner_id_fkey"
DETAIL: Key (owner_id)=(1) is not present in table "user".
```

---

## 🔍 تحلیل عمیق: چرا Fix ها کار نکردند؟

### مشکل اصلی: Session Isolation

1. **test_db** یک session می‌سازد
2. **Fixtures** (test_user, seed_roles, etc.) در این session data را commit می‌کنند
3. **API calls** از `deps.get_db` استفاده می‌کنند
4. `deps.get_db` یک wrapper است که `core.database.get_db` را فراخوانی می‌کند
5. `core.database.get_db` یک session **جدید** از `SessionLocal()` می‌سازد
6. این session جدید test data را نمی‌بیند (چون در transaction جداگانه است)

### چرا Override کار نکرد؟

**Approach 1**: Override `deps.get_db`
- ❌ کار نکرد چون `DBSession = Annotated[AsyncSession, Depends(get_db)]` در import time evaluate می‌شود

**Approach 2**: Override `database.get_db`
- ❌ کار نکرد چون `deps.get_db` یک reference به آن در import time گرفته

**Approach 3**: Monkey patch `database.get_db`
- ❌ کار نکرد چون reference در `deps._get_db` قبلاً set شده

**Approach 4**: Override هر دو
- ❌ همچنان کار نکرد - احتمالاً به دلیل evaluation order یا caching

---

## 🛠️ راه‌حل‌های پیشنهادی (برای تلاش بعدی)

### Option 1: استفاده از Nested Transaction با SAVEPOINT ⭐

```python
@pytest_asyncio.fixture(scope="function")
async def test_db():
    async with test_engine.connect() as connection:
        # شروع outer transaction
        trans = await connection.begin()
        
        # Bind session به این connection
        session = AsyncSession(bind=connection, expire_on_commit=False)
        
        # شروع nested transaction (savepoint)
        await session.begin_nested()
        
        yield session
        
        # Rollback nested
        await session.rollback()
        # Rollback outer
        await trans.rollback()
        await connection.close()
```

**مزیت**: همه تست‌ها در یک transaction ماندگار هستند و data visible است.

---

### Option 2: بازنویسی deps.get_db ⭐

**در `app/api/deps.py`**:
```python
# حذف wrapper - استفاده مستقیم از core.database.get_db
from ..core.database import get_db

# حذف این:
# async def get_db() -> AsyncGenerator:
#     from ..core.database import get_db as _get_db
#     async for session in _get_db():
#         yield session

DBSession = Annotated[AsyncSession, Depends(get_db)]
```

**مزیت**: dependency override به درستی کار می‌کند.

---

### Option 3: استفاده از TestClient به جای AsyncClient 

```python
from starlette.testclient import TestClient  # sync client

@pytest.fixture(scope="function")
def client(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

**مزیت**: ممکن است dependency injection بهتر کار کند.

---

### Option 4: بازنویسی کامل Test Infrastructure

1. حذف transaction rollback strategy
2. استفاده از real DB commits
3. Cleanup با `DELETE` queries به جای `drop_all`
4. استفاده از factories برای test data

---

## 📝 تست Validation - آیا Transaction کار می‌کند؟

**تست ساده**:
```python
# Create user و commit
async with TestSessionLocal() as session:
    user = User(email='test@test.com', ...)
    session.add(user)
    await session.commit()
    print(f'User created with ID: {user.id}')

# Fetch در session جدید
async with TestSessionLocal() as session2:
    result = await session2.execute(select(User).where(User.id == user.id))
    found_user = result.scalar_one_or_none()
    print(f'User found: {found_user is not None}')
```

**نتیجه**: ✅ **User found: True**

پس transaction isolation در حالت عادی کار می‌کند، اما در تست‌ها با dependency injection مشکل داریم.

---

## 🎯 نتیجه‌گیری

### آنچه یاد گرفتیم

1. ✅ Transaction commit/rollback strategy را تغییر دادیم
2. ✅ Rate limiter را mock کردیم
3. ✅ Dependency override patterns را امتحان کردیم
4. ✅ مشکل اصلی را شناسایی کردیم: **Dependency Injection در FastAPI با test fixtures سازگار نیست**

### چرا تلاش ناموفق بود؟

مشکل **معماری تست infrastructure** است، نه bug های ساده:
- FastAPI dependency injection در import time evaluate می‌شود
- Override در runtime تأثیری ندارد
- Test fixtures با API call lifecycle sync نیستند

### توصیه نهایی

برای رسیدن به 75%+ pass rate، نیاز به **بازنویسی کامل test infrastructure** داریم با یکی از options بالا. این کار حدود 4-6 ساعت زمان می‌برد.

---

## 📊 فایل‌های تغییر یافته

```
modified:   backend/tests/conftest.py
  ~ test_db fixture (transaction strategy)
  + mock_rate_limiter fixture (auto-use)
  ~ client fixture (dependency overrides)
```

### تعداد تغییرات
- **خطوط اضافه شده**: ~35
- **خطوط حذف شده**: ~8
- **خطوط تغییر یافته**: ~15
- **جمع**: ~58 خط

---

**تاریخ گزارش**: 2025-11-02 20:15 UTC+4  
**نسخه**: 1.0  
**وضعیت**: تلاش ناموفق - نیاز به refactor بنیادی

