# معماری Backend - Minila MVP

> راهنمای جامع معماری لایه‌ای برای پلتفرم هماهنگی مسافر-بار

**نسخه**: 0.7.0  
**آخرین به‌روزرسانی**: 2025-12-12

---

## 📋 فهرست مطالب

1. [نمای کلی](#نمای-کلی)
2. [ساختار فولدرها](#ساختار-فولدرها)
3. [لایه‌ها و مسئولیت‌ها](#لایه‌ها-و-مسئولیت‌ها)
4. [جریان درخواست](#جریان-درخواست)
5. [امنیت و Rate Limiting](#امنیت-و-rate-limiting)
6. [قراردادها و استانداردها](#قراردادها-و-استانداردها)
7. [نکات توسعه](#نکات-توسعه)

---

## 🎯 نمای کلی

معماری backend بر اساس **الگوی لایه‌ای (Layered Architecture)** طراحی شده است. این معماری کد را به لایه‌های منطقی با مسئولیت‌های مشخص تقسیم می‌کند.

### اصول کلیدی

- ✅ **جداسازی مسئولیت‌ها** (Separation of Concerns)
- ✅ **وابستگی یک‌طرفه** (بالا به پایین)
- ✅ **قابلیت تست بالا** (هر لایه مستقل)
- ✅ **استقلال از فریم‌ورک** (منطق کسب‌وکار مستقل از FastAPI)

### استک تکنولوژی

- **Framework**: FastAPI 0.115+
- **ORM**: SQLAlchemy 2.x (async)
- **Database**: PostgreSQL 15+
- **Cache/Rate Limit**: Redis 7+
- **Migration**: Alembic
- **Validation**: Pydantic v2
- **Python**: 3.12+

---

## 📁 ساختار فولدرها

```
backend/app/
│
├── main.py                    # نقطه ورود اپلیکیشن
│
├── api/                       # لایه API (HTTP)
│   ├── __init__.py
│   ├── deps.py               # وابستگی‌های FastAPI (DI)
│   └── routers/              # Endpoints به تفکیک domain
│       ├── __init__.py
│       ├── auth.py           # ثبت‌نام/ورود
│       ├── users.py          # کاربران
│       ├── communities.py    # کامیونیتی‌ها
│       ├── cards.py          # کارت‌های سفر/بار
│       ├── messages.py       # پیام‌رسانی
│       ├── locations.py      # کشورها و شهرها
│       └── admin.py          # پنل مدیریت (فقط ادمین)
│
├── core/                      # لایه هسته (تنظیمات و ابزار)
│   ├── __init__.py
│   ├── config.py             # تنظیمات از .env
│   ├── security.py           # JWT, OTP, password hashing
│   └── rate_limit.py         # محدودسازی نرخ با Redis
│
├── models/                    # لایه دیتا (ORM)
│   ├── __init__.py
│   ├── base.py               # Base class با Integer ID و timestamp
│   ├── location.py           # مدل Country و City
│   ├── avatar.py             # مدل Avatar
│   ├── product.py            # مدل ProductClassification
│   ├── user.py               # مدل User
│   ├── role.py               # مدل Role، Access و RoleAccess
│   ├── community.py          # مدل Community
│   ├── membership.py         # مدل Membership و Request
│   ├── card.py               # مدل Card و CardCommunity
│   ├── message.py            # مدل Message
│   ├── user_block.py         # مدل UserBlock
│   ├── report.py             # مدل Report
│   └── log.py                # مدل Log
│
├── schemas/                   # لایه انتقال داده (DTO)
│   ├── __init__.py
│   ├── auth.py               # LoginRequest, OTPRequest
│   ├── user.py               # UserCreate, UserOut, UserMeOut
│   ├── community.py          # CommunityCreate, CommunityOut (با is_member و my_role)
│   ├── membership.py         # MembershipOut, RequestOut (با status computed field)
│   ├── card.py               # CardCreate, CardOut, CardFilter
│   └── message.py            # MessageCreate, MessageOut, ConversationOut
│
├── services/                  # لایه منطق کسب‌وکار
│   ├── __init__.py
│   ├── auth_service.py       # منطق احراز هویت
│   ├── user_service.py       # منطق کاربران
│   ├── community_service.py  # منطق کامیونیتی‌ها
│   ├── card_service.py       # منطق کارت‌ها
│   ├── message_service.py    # منطق پیام + بررسی کامیونیتی مشترک
│   ├── log_service.py        # منطق لاگ‌ها
│   └── admin_service.py      # منطق پنل مدیریت
│
├── repositories/              # لایه دسترسی به دیتا (CRUD)
│   ├── __init__.py
│   ├── user_repo.py          # کوئری‌های User
│   ├── community_repo.py     # کوئری‌های Community
│   ├── card_repo.py          # کوئری‌های Card + فیلترها
│   ├── message_repo.py       # کوئری‌های Message
│   ├── membership_repo.py    # کوئری‌های Membership
│   ├── location_repo.py      # کوئری‌های Country و City
│   └── admin_repo.py         # کوئری‌های آماری پنل مدیریت
│
└── utils/                     # ابزارهای کمکی
    ├── __init__.py
    ├── email.py              # ارسال ایمیل با SMTP
    ├── logger.py             # تنظیمات logging
    └── pagination.py         # کمکی‌های pagination
```

---

## 🏗️ لایه‌ها و مسئولیت‌ها

### 1️⃣ API Layer (`api/`)

**مسئولیت**: دریافت درخواست HTTP و بازگرداندن پاسخ

#### `api/routers/`
- تعریف endpoints با decoratorهای FastAPI
- Validation ورودی با Pydantic schemas
- فراخوانی service layer
- تبدیل exception به HTTPException
- **ممنوع**: منطق کسب‌وکار

```python
# ✅ درست
@router.post("/cards", status_code=201)
async def create_card(
    card_data: CardCreate,
    current_user: CurrentUser,
    db: DBSession
):
    card = await card_service.create_card(db, card_data, current_user)
    return card

# ❌ غلط (منطق در router)
@router.post("/cards")
async def create_card(...):
    if user.is_banned:  # این باید در service باشد!
        raise HTTPException(403)
```

#### `api/deps.py`
- Dependency injection functions
- `get_db()`: دریافت database session
- `get_current_user()`: احراز هویت از JWT
- `get_current_active_superuser()`: بررسی دسترسی ادمین (برای پنل مدیریت)
- `verify_rate_limit()`: بررسی محدودیت نرخ

---

### 2️⃣ Core Layer (`core/`)

**مسئولیت**: تنظیمات و ابزارهای مشترک

#### `core/config.py`
- تنظیمات با `pydantic-settings`
- خواندن از `.env`
- Type-safe settings

#### `core/security.py`
- تولید و تایید OTP
- Hash و verify کردن password
- تولید و decode کردن JWT
- ابزارهای امنیتی

#### `core/rate_limit.py`
- محدودسازی با Redis
- کلیدهای rate limit
- چک کردن limit

---

### 3️⃣ Domain Layer (`models/`, `schemas/`, `services/`)

**مسئولیت**: منطق کسب‌وکار و قوانین دامنه

#### `models/`
- تعریف جداول دیتابیس با SQLAlchemy
- روابط بین جداول
- فیلدهای مشترک: `id` (Integer autoincrement), `created_at`, `updated_at`
- **ممنوع**: منطق کسب‌وکار در مدل‌ها

**مدل‌های موجود (18 جدول)**:
- **Location**: `Country`, `City`
- **Media**: `Avatar`
- **Product**: `ProductClassification`
- **User**: `User`
- **Role & Access**: `Role`, `Access`, `RoleAccess`
- **Community**: `Community`, `Membership`, `Request`
- **Card**: `Card`, `CardCommunity`
- **Communication**: `Message`
- **Security**: `UserBlock`, `Report`, `Log`

**نکات کلیدی**:
- تمام ID‌ها Integer با autoincrement
- Foreign Keys با ondelete مناسب (CASCADE/RESTRICT/SET NULL)
- Index‌های مناسب برای queryهای پرتکرار
- Check Constraints برای validate کردن داده در سطح DB

#### `schemas/`
- Pydantic models برای validation
- تبدیل داده بین لایه‌ها
- جدا کردن `Create`, `Update`, `Out` schemas

#### `services/`
- **قلب اپلیکیشن**: تمام منطق کسب‌وکار اینجاست
- بررسی قوانین و شرایط
- هماهنگی بین repositories
- **مستقل از FastAPI**: نباید چیزی از FastAPI import کند

```python
# ✅ درست - سرویس مستقل
async def send_message(
    db: Session,
    sender_id: str,
    card_id: str,
    content: str
) -> Message:
    # 1. بررسی کامیونیتی مشترک
    has_common = await check_common_community(db, sender_id, card.owner_id)
    if not has_common:
        raise PermissionError("No common community")
    
    # 2. بررسی rate limit
    # 3. ساخت پیام
    # 4. ارسال نوتیف
    return message
```

---

### 4️⃣ Data Layer (`repositories/`)

**مسئولیت**: دسترسی به دیتابیس (CRUD)

- کوئری‌های دیتابیس
- فیلتر و جست‌وجو
- Pagination
- **ممنوع**: منطق کسب‌وکار

```python
# ✅ درست - فقط query
async def get_cards_by_filter(
    db: Session,
    filters: CardFilter,
    page: int,
    page_size: int
) -> list[Card]:
    query = select(Card)
    if filters.origin:
        query = query.where(Card.origin == filters.origin)
    # ...
    return await db.execute(query)

# ❌ غلط - منطق در repository
async def get_cards(...):
    cards = await db.execute(query)
    # بررسی permission اینجا نباید باشد!
    return [c for c in cards if user.can_view(c)]
```

---

### 5️⃣ Utils Layer (`utils/`)

**مسئولیت**: ابزارهای کمکی عمومی

- ارسال ایمیل
- Logging
- Pagination helpers
- **ممنوع**: منطق دامنه

---

## 🔄 جریان درخواست

### مثال عملی: ارسال پیام به صاحب کارت

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/v1/messages
     ▼
┌─────────────────────────────────────┐
│  1. Router (api/routers/messages.py)│
│  - Validate input (Pydantic)        │
│  - Extract current_user from JWT    │
└────┬────────────────────────────────┘
     │ call service
     ▼
┌─────────────────────────────────────┐
│  2. Service (services/message.py)   │
│  - Check common community           │
│  - Check rate limit                 │
│  - Business logic                   │
└────┬────────────────────────────────┘
     │ call repository
     ▼
┌─────────────────────────────────────┐
│  3. Repository (repos/message.py)   │
│  - INSERT INTO messages ...         │
│  - Return Message object            │
└────┬────────────────────────────────┘
     │ return
     ▼
┌─────────────────────────────────────┐
│  4. Service                         │
│  - Send email notification          │
│  - Log event                        │
└────┬────────────────────────────────┘
     │ return
     ▼
┌─────────────────────────────────────┐
│  5. Router                          │
│  - Convert to Pydantic schema       │
│  - Return HTTP 201                  │
└────┬────────────────────────────────┘
     │ JSON response
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### کد نمونه کامل

```python
# ========== Router (api/routers/messages.py) ==========
@router.post("/", status_code=201)
async def send_message(
    data: MessageCreate,
    current_user: CurrentUser,
    db: DBSession,
    _: MessageRateLimit  # بررسی rate limit
) -> MessageOut:
    """ارسال پیام به صاحب کارت."""
    message = await message_service.send_message(
        db, data, current_user["user_id"]
    )
    return MessageOut.from_orm(message)


# ========== Service (services/message_service.py) ==========
async def send_message(
    db: Session,
    data: MessageCreate,
    sender_id: str
) -> Message:
    """منطق ارسال پیام."""
    # 1. دریافت کارت
    card = await card_repo.get_by_id(db, data.card_id)
    if not card:
        raise ValueError("Card not found")
    
    # 2. بررسی کامیونیتی مشترک
    has_common = await community_repo.check_common_membership(
        db, sender_id, card.owner_id
    )
    if not has_common:
        raise PermissionError("No common community with card owner")
    
    # 3. ساخت پیام
    message = await message_repo.create(
        db, sender_id=sender_id,
        recipient_id=card.owner_id,
        card_id=card.id,
        content=data.content
    )
    
    # 4. ارسال ایمیل
    await send_notification_email(card.owner.email, message)
    
    # 5. ثبت لاگ
    logger.info(f"Message sent: {sender_id} → {card.owner_id}")
    
    return message


# ========== Repository (repositories/message_repo.py) ==========
async def create(
    db: Session,
    sender_id: str,
    recipient_id: str,
    card_id: str,
    content: str
) -> Message:
    """ذخیره پیام در دیتابیس."""
    message = Message(
        sender_id=sender_id,
        recipient_id=recipient_id,
        card_id=card_id,
        content=content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
```

---

## 🔐 امنیت و Rate Limiting

### احراز هویت (Authentication)

#### 1. ثبت‌نام و تایید ایمیل
```
User → POST /auth/signup {"email": "...", "password": "...", ...}
     ← 201 Created + OTP sent to email (6 digits, 10 min expiry)
User → POST /auth/verify-email {"email": "...", "otp_code": "123456"}
     ← JWT access_token (24h) + refresh_token (7d)
```

#### 2. ورود با رمز عبور
```
User → POST /auth/login-password {"email": "...", "password": "..."}
     ← JWT access_token (24h) + refresh_token (7d)
```

#### 3. ورود با OTP
```
User → POST /auth/request-otp {"email": "..."}
     ← OTP sent to email (6 digits, 10 min expiry)
User → POST /auth/verify-otp {"email": "...", "otp_code": "123456"}
     ← JWT access_token (24h) + refresh_token (7d)
```

#### 4. تغییر رمز عبور
```
User → PUT /users/me/password {"old_password": "...", "new_password": "..."}
     ← 200 OK
```

#### 5. استفاده از JWT
```python
# در هر درخواست:
Authorization: Bearer <access_token>

# FastAPI dependency:
current_user = Depends(get_current_user)

# بررسی email_verified در get_current_user
# کاربران با ایمیل تایید نشده نمی‌توانند از API استفاده کنند
```

### Rate Limiting

#### محدودیت پیام (5/روز)
```python
@router.post("/messages", dependencies=[Depends(verify_message_rate_limit)])
```

#### محدودیت API (100/دقیقه)
```python
@router.post("/cards", dependencies=[Depends(verify_api_rate_limit)])
```

### امنیت داده

- تمام passwordها hash می‌شوند (SHA256 + salt)
- OTPها با HMAC-SHA256 هش می‌شوند
- JWTها امضا می‌شوند (HMAC-SHA256)
- CORS فقط برای domainهای مجاز
- SQL injection با SQLAlchemy ORM جلوگیری می‌شود

---

## 📝 قراردادها و استانداردها

### نام‌گذاری

```python
# Variables & Functions: snake_case
user_email = "test@example.com"
async def get_user_by_id(user_id: str):

# Classes: PascalCase
class UserService:
class CardRepository:

# جداول دیتابیس: مفرد، snake_case
user, community, membership, card, message

# فایل‌ها: snake_case
user_service.py, card_repo.py
```

### Type Hints

```python
# ✅ همیشه type hints بنویسید
async def create_user(
    db: Session,
    email: str,
    name: str | None = None
) -> User:
    ...

# ✅ برای dict/list هم
def get_filters() -> dict[str, Any]:
    ...
```

### Async/Await

```python
# ✅ برای database و I/O
async def get_user(db: AsyncSession, user_id: str):
    result = await db.execute(...)
    
# ✅ برای routers
@router.get("/users/{user_id}")
async def get_user_endpoint(...):
```

### Error Handling

```python
# در Service:
if not has_permission:
    raise PermissionError("Not allowed")

# در Router:
try:
    result = await service.do_something()
except PermissionError as e:
    raise HTTPException(403, detail=str(e))
except ValueError as e:
    raise HTTPException(400, detail=str(e))
```

### Docstrings

```python
def send_otp(email: str) -> bool:
    """ارسال OTP به ایمیل کاربر.
    
    Args:
        email: آدرس ایمیل
        
    Returns:
        True در صورت موفقیت
        
    Raises:
        ValueError: اگر ایمیل نامعتبر باشد
    """
```

---

## 💻 نکات توسعه

### چگونه روتر جدید اضافه کنیم؟

```python
# 1. ساخت فایل router
# backend/app/api/routers/my_feature.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_items():
    return {"items": []}

# 2. ثبت در main.py
from .api.routers import my_feature

app.include_router(
    my_feature.router,
    prefix="/api/v1/my-feature",
    tags=["MyFeature"]
)
```

### چگونه مدل جدید بسازیم؟

```python
# 1. تعریف مدل
# backend/app/models/my_model.py
from .base import BaseModel
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

class MyModel(BaseModel):
    __tablename__ = "my_model"
    
    name: Mapped[str] = mapped_column(String(100))

# 2. ساخت migration
cd backend
alembic revision --autogenerate -m "add my_model table"
alembic upgrade head
```

### چگونه سرویس بنویسیم؟

```python
# backend/app/services/my_service.py
from sqlalchemy.ext.asyncio import AsyncSession

async def do_business_logic(
    db: AsyncSession,
    param: str
) -> ResultType:
    """توضیح عملکرد سرویس."""
    # 1. Validate
    if not param:
        raise ValueError("Param required")
    
    # 2. Call repository
    result = await my_repo.fetch_data(db, param)
    
    # 3. Business logic
    processed = process(result)
    
    # 4. Log
    logger.info(f"Done: {param}")
    
    return processed
```

### تست نوشتن

```python
# tests/services/test_my_service.py
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_do_business_logic():
    # Arrange
    db_mock = AsyncMock()
    my_repo.fetch_data = AsyncMock(return_value=fake_data)
    
    # Act
    result = await my_service.do_business_logic(db_mock, "test")
    
    # Assert
    assert result.id == expected_id
```

---

## 🗄️ مدل‌های دیتابیس و روابط

### نمای کلی

سیستم شامل **18 جدول** است که در 8 گروه منطقی دسته‌بندی می‌شوند:

### 1. Location Models

#### Country
- `id`, `name` (unique), `created_at`, `updated_at`
- روابط: `cities` (one-to-many → City)

#### City
- `id`, `name`, `country_id` (FK), `created_at`, `updated_at`
- روابط: `country` (many-to-one → Country)
- Index: `(country_id, name)`

### 2. Media Models

#### Avatar
- `id`, `url`, `mime_type`, `size_bytes`, `created_at`, `updated_at`
- استفاده: تصاویر پروفایل User و Community
- Index: `created_at`

### 3. Product Models

#### ProductClassification
- `id`, `name` (unique), `created_at`, `updated_at`
- مثال: پوشاک، الکترونیک، خوراکی

### 4. User Models

#### User
- فیلدها: `id`, `email` (unique), `first_name`, `last_name`, `password`, `otp_code`
- اطلاعات شخصی: `national_id`, `gender`, `birthday`, `postal_code`
- وضعیت: `is_active`, `is_admin`
- Foreign Keys: `avatar_id`, `country_id`, `city_id`
- Index: `email` (unique), `created_at`

**نکته امنیتی**: `password` و `otp_code` فعلاً خام هستند → باید hash شوند (مشاهده `MUSTTODO.md`)

### 5. Role & Access Models

#### Role
- `id`, `name` (unique), `created_at`, `updated_at`
- مقادیر: "member", "manager", "owner"

#### Access
- `id`, `name` (unique), `created_at`, `updated_at`
- مقادیر: "read", "write", "delete", "manage_members", etc.

#### RoleAccess (جدول واسط)
- `id`, `role_id` (FK), `access_id` (FK), `created_at`, `updated_at`
- Unique: `(role_id, access_id)`
- Index: `role_id`, `access_id`

### 6. Community Models

#### Community
- `id`, `name`, `slug` (unique), `bio`, `avatar_id` (FK), `owner_id` (FK), `created_at`, `updated_at`
- `slug`: آیدی یکتا برای جستجو و اشتراک‌گذاری (فقط حروف انگلیسی کوچک، اعداد و آندرلاین)
- روابط: `owner` (many-to-one → User), `avatar` (many-to-one → Avatar)
- Index: `owner_id`, `slug` (unique)

#### Membership
- `id`, `user_id` (FK), `community_id` (FK), `role_id` (FK), `is_active`, timestamps
- Unique: `(user_id, community_id)` - هر کاربر حداکثر یک عضویت در هر کامیونیتی
- Index: `(community_id, is_active)`
- روابط: `user`, `community`, `role`

#### Request
- `id`, `user_id` (FK), `community_id` (FK), `is_approved`, timestamps
- `is_approved`: `NULL` = pending, `TRUE` = approved, `FALSE` = rejected
- Unique: `(user_id, community_id)` - جلوگیری از درخواست تکراری
- Index: `(community_id, is_approved, created_at)`

### 7. Card Models

#### Card
- فیلدها: `id`, `owner_id` (FK), `is_sender` (Boolean)
- مبدأ/مقصد: `origin_country_id`, `origin_city_id`, `destination_country_id`, `destination_city_id`
- زمان: `start_time_frame`, `end_time_frame`, `ticket_date_time`
- جزئیات: `weight`, `is_packed`, `price_aed`, `description`, `product_classification_id`
- Check: `end_time_frame >= start_time_frame` (if both not null)
- Index‌ها: `origin_city_id`, `destination_city_id`, `start_time_frame`, `end_time_frame`, `product_classification_id`, `is_packed`

**منطق**:
- `is_sender=1` → کارت فرستنده کالا (از `start_time_frame` تا `end_time_frame`)
- `is_sender=0` → کارت مسافر (زمان دقیق: `ticket_date_time`)

#### CardCommunity (جدول واسط)
- `id`, `card_id` (FK), `community_id` (FK), timestamps
- Unique: `(card_id, community_id)`
- Index: `community_id`
- **منطق**: اگر کارت در این جدول نباشد → نمایش سراسری؛ اگر باشد → فقط در کامیونیتی‌های مشخص

### 8. Communication & Security Models

#### Message
- `id`, `sender_id` (FK), `receiver_id` (FK), `body`, timestamps
- Check: `sender_id != receiver_id`
- Index: `(receiver_id, created_at)`, `(sender_id, created_at)`

**قید مهم**: پیام فقط اگر sender و receiver حداقل یک کامیونیتی مشترک داشته باشند → check در service layer

#### UserBlock
- `id`, `blocker_id` (FK), `blocked_id` (FK), timestamps
- Unique: `(blocker_id, blocked_id)`
- Index: `blocker_id`

**تفاوت UserBlock و Ban**:
- **UserBlock (بلاک شخصی)**: توسط خود کاربر انجام می‌شود. کاربر بلاک‌شده نمی‌تواند به blocker پیام بفرستد. تأثیر محدود به تعامل دو کاربر.
- **Ban (بن سیستمی)**: توسط مدیران انجام می‌شود. فیلد `User.is_active=False` می‌شود. کاربر banned نمی‌تواند به سیستم دسترسی داشته باشد.

#### Report
- `id`, `reporter_id` (FK), `reported_id` (FK), `card_id` (FK, nullable), `body`, timestamps
- Index: `(card_id, created_at)`, `(reporter_id, created_at)`
- گزارش کاربر یا کارت توسط کاربران دیگر

#### Log
- `id`, `event_type`, `ip`, `user_agent`, `payload`, timestamps
- Foreign Keys (همه nullable): `actor_user_id`, `target_user_id`, `card_id`, `community_id`
- Index: `(event_type, created_at)`, `(actor_user_id, created_at)`
- Event Types: `signup`, `login`, `join_request`, `join_approve`, `card_create`, `message_send`, `ban`, `unban`

---

## 🌍 سیستم Location و Autocomplete

سیستم جستجوی کشورها و شهرها با پشتیبانی چندزبانه (فارسی، انگلیسی، عربی):

### ویژگی‌ها

- **چندزبانه**: نام‌های کشورها و شهرها به سه زبان فارسی، انگلیسی و عربی
- **فرودگاه‌محور**: فقط شهرهایی که دارای فرودگاه هستند (کد IATA)
- **Autocomplete**: جستجوی real-time با debounce در frontend
- **Indexed Search**: استفاده از index های دیتابیس برای جستجوی سریع
- **منبع داده**: GeoNames (http://www.geonames.org/)

### معماری

```
Frontend (cards/new page)
  ↓ کاربر تایپ می‌کند
Autocomplete Component (300ms debounce)
  ↓ API call
Location Router (/api/v1/locations/*)
  ↓
Location Repository (search methods)
  ↓
PostgreSQL (با index های optimized)
```

### مدل‌ها

**Country**:
- `id`: شناسه یکتا
- `name`: نام اصلی (انگلیسی)
- `name_en`, `name_fa`, `name_ar`: نام‌های سه‌زبانه
- `iso_code`: کد ISO دو حرفی (مثل IR, AE)

**City**:
- `id`: شناسه یکتا
- `name`: نام اصلی (انگلیسی)
- `name_en`, `name_fa`, `name_ar`: نام‌های سه‌زبانه
- `airport_code`: کد IATA فرودگاه (سه حرفی)
- `country_id`: Foreign key به Country

### Endpoints

```
GET /api/v1/locations/countries/search?q={query}&limit=10
  → جستجوی autocomplete کشورها

GET /api/v1/locations/cities/search?country_id={id}&q={query}&limit=10
  → جستجوی autocomplete شهرها در یک کشور

GET /api/v1/locations/countries/{id}
  → دریافت اطلاعات یک کشور

GET /api/v1/locations/cities/{id}
  → دریافت اطلاعات یک شهر
```

### رفتار UI

1. کاربر وارد صفحه `/cards/new` می‌شود
2. فیلد "کشور مبدأ" فعال است، کاربر شروع به تایپ می‌کند
3. فیلد "شهر مبدأ" **قفل** است (disabled) تا کشور انتخاب شود
4. پس از انتخاب کشور، فیلد شهر **باز** می‌شود (enabled)
5. جستجوی شهرها فقط در کشور انتخاب شده انجام می‌شود
6. همین فرآیند برای "مقصد" نیز تکرار می‌شود

### Populate Data

داده‌ها از GeoNames دانلود و در دیتابیس ذخیره می‌شوند:

```bash
python3 scripts/populate_locations.py
```

این اسکریپت:
1. countryInfo.txt را دانلود و پارس می‌کند
2. allCountries.txt را دانلود و شهرهای دارای فرودگاه را فیلتر می‌کند
3. alternateNamesV2.txt را دانلود و نام‌های فارسی/عربی را استخراج می‌کند
4. همه را در دیتابیس ذخیره می‌کند

---

## 🔗 نمودار روابط اصلی

```
User
 ├─→ Avatar (optional)
 ├─→ Country (optional, with multilingual names)
 ├─→ City (optional, with multilingual names)
 ├─→ Membership (many) → Community + Role
 ├─→ Request (many) → Community
 ├─→ Card (many)
 ├─→ Message (as sender/receiver)
 ├─→ UserBlock (as blocker/blocked)
 ├─→ Report (as reporter/reported)
 └─→ Log (as actor/target)

Community
 ├─→ Owner (User)
 ├─→ Avatar (optional)
 ├─→ Membership (many) → User + Role
 ├─→ Request (many) → User
 ├─→ CardCommunity (many) → Card
 └─→ Log

Card
 ├─→ Owner (User)
 ├─→ Origin Country/City (with multilingual names)
 ├─→ Destination Country/City (with multilingual names)
 ├─→ ProductClassification (optional)
 ├─→ CardCommunity (many) → Community
 ├─→ Report (many)
 └─→ Log

Country (new)
 ├─→ City (many)
 └─→ User/Card (as location reference)

City (new)
 ├─→ Country (foreign key)
 └─→ User/Card (as location reference)

Role ←→ Access (many-to-many via RoleAccess)
```

---

## 📧 سیستم ایمیل

### نمای کلی

سیستم ایمیل از **Resend API** برای ارسال ایمیل در production استفاده می‌کند.

### ویژگی‌ها

- **زبان ثابت**: تمام ایمیل‌ها **همیشه به انگلیسی** ارسال می‌شوند (صرف‌نظر از زبان کاربر)
- **Smart Notification**: برای پیام‌های جدید، فقط اولین پیام خوانده‌نشده از هر فرستنده ایمیل ارسال می‌شود
- **Redis Tracking**: ایمیل‌های ارسال‌شده با TTL 24 ساعته در Redis ذخیره می‌شوند

### قالب‌های ایمیل

```
backend/app/utils/email_templates.py
```

| Template | موارد استفاده |
|----------|---------------|
| `otp` | کد یکبار مصرف ورود/ثبت‌نام |
| `welcome` | خوش‌آمدگویی پس از ثبت‌نام |
| `new_message` | پیام جدید از کاربر دیگر |
| `unread_summary` | خلاصه پیام‌های خوانده‌نشده |
| `membership_request` | درخواست عضویت جدید (ارسال به مدیران) |
| `membership_approved` | تایید عضویت |
| `membership_rejected` | رد عضویت |
| `role_change` | تغییر نقش کاربر در کامیونیتی |

### معماری

```
User Action
    ↓
Service Layer (auth_service, community_service, message_service)
    ↓
Email Utils (backend/app/utils/email.py)
    ↓
Email Templates (get_template → always returns English)
    ↓
Resend API (production) / SMTP (development)
```

### کد نمونه

```python
# ارسال ایمیل OTP
from app.utils.email import send_otp_email
send_otp_email("user@example.com", "123456")

# ارسال نوتیفیکیشن تغییر نقش
from app.utils.email import send_role_change_notification
send_role_change_notification("user@example.com", "My Community", "Manager")
```

### تنظیمات

```env
# Provider: smtp (dev) یا resend (prod)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@minila.app
```

---

## 📚 منابع و مراجع

- [ADR-20251030: تصمیم انتخاب معماری](../docs/ADR-20251030-layered-architecture.md)
- [SCOPE.md: اسکوپ MVP](../SCOPE.md)
- [README.md: راهنمای اجرا](./README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)

---

**آخرین به‌روزرسانی**: 2025-11-12  
**نگهدارنده**: تیم Minila

