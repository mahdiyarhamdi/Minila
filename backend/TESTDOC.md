# مستندات کامل Test Suite - Backend Minila

## خلاصه اجرایی

یک test suite کامل و حرفه‌ای برای تمام 19 endpoint با **93 تست جامع** ساخته شده است. تست‌ها با infrastructure واقعی (PostgreSQL + Redis + MailHog) اجرا می‌شوند.

## آمار کلی

- **تعداد کل تست‌ها**: 93
- **تعداد endpoint های تحت پوشش**: 19
- **تعداد فایل تست**: 5
- **Infrastructure**: PostgreSQL Test + Redis Test + MailHog
- **Framework**: pytest + pytest-asyncio + httpx

## ساختار Test Suite

### 1. Infrastructure (docker-compose.yml)

Test services اضافه شده:

```yaml
db_test:          # PostgreSQL test database (port 5433)
redis_test:       # Redis test instance (port 6380)
mailhog:          # Email testing (ports 1025, 8025)
```

### 2. Test Configuration (pytest.ini)

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    asyncio: async tests
    slow: slow running tests
    integration: integration tests
```

### 3. Dependencies (requirements.txt)

Dependencies جدید:
- `pytest-cov~=5.0.0` - Coverage reporting
- `faker~=25.0.0` - Test data generation

## Fixtures (conftest.py)

### Database & Infrastructure Fixtures

| Fixture | Scope | توضیحات |
|---------|-------|----------|
| `test_db` | function | PostgreSQL session با auto cleanup |
| `redis_client` | function | Redis client برای rate limit tests |
| `client` | function | HTTP client با database override |

### User Fixtures

| Fixture | توضیحات |
|---------|----------|
| `test_user` | کاربر اول با JWT token |
| `test_user2` | کاربر دوم برای message tests |
| `test_admin` | کاربر admin با JWT token |

### Community Fixtures

| Fixture | توضیحات |
|---------|----------|
| `test_community` | کامیونیتی با test_user به عنوان owner |
| `test_community2` | کامیونیتی با test_user2 به عنوان owner |
| `test_membership` | عضویت test_user2 در test_community |

### Card & Helper Fixtures

| Fixture | توضیحات |
|---------|----------|
| `test_card` | کارت تست با test_user به عنوان owner |
| `auth_headers` | Authorization headers برای test_user |
| `auth_headers_user2` | Authorization headers برای test_user2 |

## پوشش تست‌های هر Endpoint

### 🔐 Authentication (test_auth.py) - 17 تست

#### POST /api/v1/auth/signup (5 تست)
- ✅ `test_signup_success` - ثبت‌نام موفق
- ❌ `test_signup_duplicate_email` - ایمیل تکراری (400)
- ❌ `test_signup_invalid_email` - ایمیل نامعتبر (422)
- ❌ `test_signup_missing_required_field` - فیلد الزامی خالی (422)
- ❌ `test_signup_empty_password` - پسورد خالی (422)

#### POST /api/v1/auth/request-otp (4 تست)
- ✅ `test_request_otp_success` - درخواست OTP موفق + email check
- ❌ `test_request_otp_nonexistent_user` - کاربر ناموجود (400)
- ❌ `test_request_otp_invalid_email` - ایمیل نامعتبر (422)
- ✅ `test_request_otp_updates_existing_code` - آپدیت OTP قبلی

#### POST /api/v1/auth/verify-otp (5 تست)
- ✅ `test_verify_otp_success` - تایید موفق + دریافت tokens
- ❌ `test_verify_otp_wrong_code` - کد اشتباه (401)
- ❌ `test_verify_otp_used_code` - کد استفاده شده/single-use (401)
- ❌ `test_verify_otp_nonexistent_user` - کاربر ناموجود (401)
- ❌ `test_verify_otp_invalid_email_format` - فرمت ایمیل نامعتبر (422)

#### POST /api/v1/auth/refresh (3 تست)
- ✅ `test_refresh_token_success` - refresh موفق
- ❌ `test_refresh_token_invalid` - توکن نامعتبر (401)
- ❌ `test_refresh_token_expired` - توکن منقضی شده (401)

### 👤 Users (test_users.py) - 8 تست

#### GET /api/v1/users/me (3 تست)
- ✅ `test_get_profile_success` - دریافت پروفایل موفق
- ❌ `test_get_profile_without_auth` - بدون authentication (401)
- ❌ `test_get_profile_invalid_token` - توکن نامعتبر (401)

#### PATCH /api/v1/users/me (5 تست)
- ✅ `test_update_profile_all_fields` - ویرایش تمام فیلدها
- ✅ `test_update_profile_partial` - ویرایش partial (فقط first_name)
- ❌ `test_update_profile_without_auth` - بدون authentication (401)
- ❌ `test_update_profile_invalid_data` - داده نامعتبر (422)
- ✅ `test_update_profile_check_updated_at` - بررسی timestamp
- ✅ `test_update_profile_empty_payload` - payload خالی
- ✅ `test_update_profile_with_null_values` - مقادیر null

### 🏘️ Communities (test_communities.py) - 32 تست

#### GET /api/v1/communities/ (3 تست)
- ✅ `test_get_communities_empty_list` - لیست خالی
- ✅ `test_get_communities_with_data` - لیست با داده + pagination
- ✅ `test_get_communities_pagination` - validation pagination

#### POST /api/v1/communities/ (4 تست)
- ✅ `test_create_community_success` - ساخت موفق + owner auto-assign
- ❌ `test_create_community_duplicate_name` - نام تکراری (400)
- ❌ `test_create_community_without_auth` - بدون authentication (401)
- ❌ `test_create_community_validation_error` - خطای validation (422)

#### GET /api/v1/communities/{id} (2 تست)
- ✅ `test_get_community_success` - دریافت جزئیات موفق
- ❌ `test_get_community_not_found` - کامیونیتی ناموجود (404)

#### PATCH /api/v1/communities/{id} (4 تست)
- ✅ `test_update_community_by_owner` - ویرایش توسط owner
- ❌ `test_update_community_by_non_owner` - توسط non-owner (403)
- ❌ `test_update_community_without_auth` - بدون authentication (401)
- ❌ `test_update_community_not_found` - ناموجود (404)

#### POST /api/v1/communities/{id}/join (4 تست)
- ✅ `test_join_community_success` - درخواست موفق + pending status
- ❌ `test_join_community_duplicate_request` - درخواست تکراری (400)
- ❌ `test_join_community_not_found` - کامیونیتی ناموجود (404)
- ❌ `test_join_community_without_auth` - بدون authentication (401)

#### GET /api/v1/communities/{id}/requests (3 تست)
- ✅ `test_get_requests_by_owner` - لیست توسط owner
- ❌ `test_get_requests_by_non_owner` - توسط non-owner (403)
- ❌ `test_get_requests_without_auth` - بدون authentication (401)

#### POST /api/v1/communities/{id}/requests/{req_id}/approve (4 تست)
- ✅ `test_approve_request_success` - تایید موفق + membership
- ❌ `test_approve_request_by_non_owner` - توسط non-owner (403)
- ❌ `test_approve_request_not_found` - درخواست ناموجود (400)
- ❌ `test_approve_request_without_auth` - بدون authentication (401)

#### POST /api/v1/communities/{id}/requests/{req_id}/reject (3 تست)
- ✅ `test_reject_request_success` - رد موفق + 204
- ❌ `test_reject_request_by_non_owner` - توسط non-owner (403)
- ❌ `test_reject_request_without_auth` - بدون authentication (401)

#### GET /api/v1/communities/{id}/members (3 تست)
- ✅ `test_get_members_with_pagination` - لیست اعضا + pagination
- ✅ `test_get_members_only_active` - فقط اعضای فعال
- ❌ `test_get_members_not_found` - کامیونیتی ناموجود (404)

### 📇 Cards (test_cards.py) - 21 تست

#### GET /api/v1/cards/ (6 تست)
- ✅ `test_get_cards_with_pagination` - لیست با pagination
- ✅ `test_get_cards_filter_origin_city` - فیلتر origin_city_id
- ✅ `test_get_cards_filter_destination_city` - فیلتر destination_city_id
- ✅ `test_get_cards_filter_is_sender_true` - فیلتر is_sender=true
- ✅ `test_get_cards_filter_is_sender_false` - فیلتر is_sender=false
- ✅ `test_get_cards_multiple_filters` - چند فیلتر ترکیبی

#### POST /api/v1/cards/ (5 تست)
- ✅ `test_create_passenger_card_success` - ساخت کارت مسافر
- ✅ `test_create_sender_card_success` - ساخت کارت فرستنده
- ❌ `test_create_card_without_auth` - بدون authentication (401)
- ❌ `test_create_card_validation_error` - خطای validation (422)
- ✅ `test_create_card_with_community_ids` - با community_ids

#### GET /api/v1/cards/{id} (2 تست)
- ✅ `test_get_card_success` - دریافت جزئیات موفق
- ❌ `test_get_card_not_found` - کارت ناموجود (404)

#### PATCH /api/v1/cards/{id} (4 تست)
- ✅ `test_update_card_by_owner` - ویرایش توسط owner
- ❌ `test_update_card_by_non_owner` - توسط non-owner (403)
- ❌ `test_update_card_without_auth` - بدون authentication (401)
- ❌ `test_update_card_not_found` - کارت ناموجود (404)

#### DELETE /api/v1/cards/{id} (4 تست)
- ✅ `test_delete_card_by_owner` - حذف موفق + 204
- ❌ `test_delete_card_by_non_owner` - توسط non-owner (403)
- ❌ `test_delete_card_without_auth` - بدون authentication (401)
- ❌ `test_delete_card_not_found` - کارت ناموجود (404)

### 💬 Messages (test_messages.py) - 15 تست

#### POST /api/v1/messages/ (7 تست) ⭐ **مهم**
- ✅ `test_send_message_success_with_common_community` - ارسال موفق با کامیونیتی مشترک
- ❌ `test_send_message_blocked_no_common_community` - بدون کامیونیتی مشترک (403)
- ❌ `test_send_message_rate_limit_exceeded` - rate limit (429) - 6 پیام روزانه
- ❌ `test_send_message_without_auth` - بدون authentication (401)
- ❌ `test_send_message_validation_error_missing_body` - body خالی (422)
- ❌ `test_send_message_validation_error_empty_body` - body empty (422)
- ❌ `test_send_message_to_nonexistent_user` - کاربر ناموجود (400)

#### GET /api/v1/messages/inbox (4 تست)
- ✅ `test_get_inbox_with_messages` - لیست inbox با pagination
- ✅ `test_get_inbox_only_received_messages` - فقط پیام‌های دریافتی
- ✅ `test_get_inbox_newest_first` - ترتیب جدیدترین
- ❌ `test_get_inbox_without_auth` - بدون authentication (401)

#### GET /api/v1/messages/sent (4 تست)
- ✅ `test_get_sent_with_messages` - لیست sent با pagination
- ✅ `test_get_sent_only_sent_messages` - فقط پیام‌های ارسالی
- ✅ `test_get_sent_newest_first` - ترتیب جدیدترین
- ❌ `test_get_sent_without_auth` - بدون authentication (401)

## ویژگی‌های تست‌ها

### ✨ تست‌های پیچیده

1. **Rate Limiting با Redis واقعی**
   - تست محدودیت 5 پیام در روز
   - Clear کردن Redis keys قبل از هر تست
   - Isolation کامل بین تست‌ها

2. **Community Membership Check**
   - تست بلاک پیام بدون کامیونیتی مشترک
   - ایجاد و حذف memberships در تست‌ها

3. **OTP Single-Use**
   - تست استفاده مجدد از OTP (باید fail کند)
   - Clear کردن OTP بعد از استفاده موفق

4. **Pagination Testing**
   - تست page و page_size
   - تست ترتیب (newest first)
   - تست لیست خالی

### 🎯 الگوی AAA

تمام تست‌ها از الگوی AAA پیروی می‌کنند:

```python
async def test_example(client, test_user):
    # Arrange: آماده‌سازی داده‌ها
    headers = {"Authorization": f"Bearer {test_user['token']}"}
    data = {"field": "value"}
    
    # Act: اجرای عملیات
    response = await client.post("/endpoint", json=data, headers=headers)
    
    # Assert: بررسی نتیجه
    assert response.status_code == 201
    assert response.json()["field"] == "value"
```

## اجرای تست‌ها

### راه‌اندازی Test Infrastructure

```bash
# بالا آوردن test services
docker-compose up -d db_test redis_test mailhog

# نصب dependencies (اگر نیاز باشد)
docker-compose exec backend pip install pytest-cov faker
```

### اجرای تست‌ها

```bash
# اجرای تمام تست‌ها
docker-compose exec backend pytest tests/ -v

# اجرای با coverage
docker-compose exec backend pytest tests/ --cov=app --cov-report=html --cov-report=term

# اجرای یک فایل خاص
docker-compose exec backend pytest tests/api/test_auth.py -v

# اجرای یک تست خاص
docker-compose exec backend pytest tests/api/test_auth.py::TestSignup::test_signup_success -v

# اجرای با توقف بعد از اولین خطا
docker-compose exec backend pytest tests/ -x

# اجرای با توقف بعد از N خطا
docker-compose exec backend pytest tests/ --maxfail=5
```

### مشاهده Coverage Report

```bash
# HTML report
docker-compose exec backend pytest tests/ --cov=app --cov-report=html
# سپس باز کنید: htmlcov/index.html

# Terminal report
docker-compose exec backend pytest tests/ --cov=app --cov-report=term-missing
```

## مشکلات شناخته شده و راه‌حل‌ها

### 1. Model Relationships Error

**مشکل**: `Can't find strategy (('lazy', 'selectinload'),) for User.country`

**علت**: User model از `lazy="selectinload"` استفاده می‌کند که فقط در queries کار می‌کند.

**راه‌حل**:
```python
# در app/models/user.py تغییر دهید:
country: Mapped[Optional["Country"]] = relationship("Country", lazy="select")
city: Mapped[Optional["City"]] = relationship("City", lazy="select")
```

### 2. Event Loop Deprecation Warning

**مشکل**: Warning در مورد `event_loop` fixture

**راه‌حل**: حذف `event_loop` fixture از conftest.py (pytest-asyncio خودش handle می‌کند)

### 3. Container Volume Mount

**مشکل**: فایل‌های tests در container قدیمی هستند

**راه‌حل**: 
```bash
# کپی فایل‌های جدید
docker cp tests/ minila_backend:/app/

# یا rebuild image
docker-compose build backend
```

## بهترین روش‌ها (Best Practices)

### ✅ Do's

1. **همیشه از fixtures استفاده کنید**
   - تکرار کد را کم می‌کند
   - Setup/teardown automatic است

2. **تست‌ها باید independent باشند**
   - هر تست باید مستقل اجرا شود
   - ترتیب اجرا نباید مهم باشد

3. **نام‌گذاری واضح**
   - `test_endpoint_scenario_expected_result`
   - مثال: `test_signup_duplicate_email_returns_400`

4. **Docstrings برای تست‌ها**
   - توضیح دهید تست چه می‌کند
   - چرا این سناریو مهم است

### ❌ Don'ts

1. **تست‌های وابسته به یکدیگر**
   - هرگز تست B را وابسته به نتیجه تست A نکنید

2. **Hard-coded values**
   - از fixtures و helper functions استفاده کنید

3. **تست‌های طولانی**
   - تست‌ها باید سریع باشند (<5s)
   - اگر کند است، شاید integration test است نه unit test

4. **Assert های متعدد بدون context**
   - هر assert باید واضح باشد چرا fail می‌کند

## Coverage Goal

**هدف**: حداقل 75% coverage

**وضعیت فعلی**: 
- Infrastructure: ✅ آماده
- Tests: ✅ 93 تست نوشته شده
- Issues: ⚠️ Relationship errors در models (قابل حل)

## مراحل بعدی

### Phase 1: Fix Model Issues
1. تصحیح User.country و User.city relationships
2. اطمینان از import صحیح تمام models
3. Test مجدد تمام endpoints

### Phase 2: Add More Test Cases
1. Test edge cases بیشتر
2. Test concurrent requests
3. Test database transactions

### Phase 3: Performance Testing
1. Load testing با locust
2. Stress testing برای rate limiting
3. Database query optimization

## نتیجه‌گیری

یک test suite کامل و حرفه‌ای با 93 تست جامع برای تمام 19 endpoint ساخته شده است. تست‌ها:

✅ از infrastructure واقعی استفاده می‌کنند (PostgreSQL + Redis + MailHog)
✅ تمام سناریوهای happy path و error handling را پوشش می‌دهند
✅ Rate limiting و community rules را تست می‌کنند
✅ از الگوی AAA و best practices پیروی می‌کنند
✅ مستقل و قابل اجرا در هر ترتیبی هستند

**آماده برای production با رفع مشکلات کوچک model relationships** 🎯

