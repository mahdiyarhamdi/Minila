# Backend - Minila MVP

> Backend API برای پلتفرم هماهنگی مسافر-بار

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

---

## 📖 معرفی

Backend پروژه Minila یک REST API است که با FastAPI ساخته شده و وظایف زیر را انجام می‌دهد:

- 🔐 احراز هویت کاربران با Password و OTP + تایید ایمیل اجباری
- 🔑 ورود با دو روش: رمز عبور یا کد یکبار مصرف (OTP)
- 👥 مدیریت کامیونیتی‌ها و درخواست‌های عضویت
- 🚗 ایجاد و جست‌وجوی کارت‌های سفر/بار
- 💬 پیام‌رسانی بین کاربران (با شرط کامیونیتی مشترک)
- 🔔 ارسال نوتیفیکیشن با ایمیل
- 🛡️ محدودسازی نرخ (rate limiting)
- 📊 ثبت لاگ‌های رویدادها

---

## 🎯 پیش‌نیازها

قبل از شروع، اطمینان حاصل کنید که این‌ها نصب هستند:

- **Python 3.12+** ([دانلود](https://www.python.org/downloads/))
- **Docker & Docker Compose** ([دانلود](https://www.docker.com/))
- **Git** ([دانلود](https://git-scm.com/))

برای توسعه محلی (بدون Docker):
- **PostgreSQL 15+**
- **Redis 7+**

---

## 🚀 نصب و راه‌اندازی

### روش 1: با Docker Compose (توصیه می‌شود)

```bash
# 1. Clone کردن repository
git clone https://github.com/mahdiyarhamdi/Minila.git
cd Minila/backend

# 2. ساخت فایل .env
cp .env.example .env
# فایل .env را ویرایش کنید

# 3. راه‌اندازی با Docker Compose
docker-compose up -d

# 4. اجرای مایگریشن‌ها
docker-compose exec backend alembic upgrade head

# 5. بررسی سلامت
curl http://localhost:8000/health
# پاسخ: {"ok": true}
```

سرور در `http://localhost:8000` در دسترس است.  
مستندات API: `http://localhost:8000/docs`

---

### روش 2: اجرای محلی (بدون Docker)

```bash
# 1. ایجاد virtual environment
cd backend
python3.12 -m venv venv
source venv/bin/activate  # در Windows: venv\Scripts\activate

# 2. نصب dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. راه‌اندازی PostgreSQL و Redis
# (فرض می‌کنیم از قبل نصب هستند)

# 4. تنظیم .env
cp .env.example .env
# DATABASE_URL و REDIS_URL را به localhost تغییر دهید

# 5. اجرای مایگریشن
alembic upgrade head

# 6. اجرای سرور
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ⚙️ متغیرهای محیطی

فایل `.env` را بسازید و این متغیرها را تنظیم کنید:

| متغیر | توضیح | مقدار پیش‌فرض | الزامی |
|-------|-------|---------------|--------|
| `APP_NAME` | نام اپلیکیشن | `Passenger Freight MVP` | ❌ |
| `DEBUG` | حالت debug | `False` | ❌ |
| `SECRET_KEY` | کلید مخفی JWT (32+ کاراکتر) | - | ✅ |
| `DATABASE_URL` | آدرس PostgreSQL | `postgresql+psycopg://...` | ✅ |
| `REDIS_URL` | آدرس Redis | `redis://redis:6379/0` | ✅ |
| `SMTP_HOST` | سرور SMTP | `mailhog` | ✅ |
| `SMTP_PORT` | پورت SMTP | `1025` | ✅ |
| `EMAIL_FROM` | ایمیل فرستنده | `no-reply@example.local` | ✅ |
| `CORS_ORIGINS` | لیست domainهای مجاز | `["http://localhost:3000"]` | ❌ |
| `OTP_EXPIRY_MINUTES` | زمان اعتبار OTP (دقیقه) | `10` | ❌ |
| `MESSAGES_PER_DAY` | محدودیت پیام روزانه | `5` | ❌ |

### نمونه فایل `.env`

```env
APP_NAME=Minila MVP
DEBUG=True
SECRET_KEY=your-super-secret-key-min-32-chars-change-in-production

# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/minila

# Redis
REDIS_URL=redis://redis:6379/0

# Email (MailHog for dev)
SMTP_HOST=mailhog
SMTP_PORT=1025
EMAIL_FROM=no-reply@minila.local

# Security
OTP_EXPIRY_MINUTES=10
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Rate Limiting
MESSAGES_PER_DAY=5
API_RATE_LIMIT_PER_MINUTE=100

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

---

## 📡 API Endpoints

### System

| Method | Endpoint | توضیح | Auth |
|--------|----------|-------|------|
| `GET` | `/` | اطلاعات API | ❌ |
| `GET` | `/health` | بررسی سلامت سرور | ❌ |
| `GET` | `/docs` | مستندات Swagger UI | ❌ |
| `GET` | `/redoc` | مستندات ReDoc | ❌ |

### Authentication (`/api/v1/auth`)

| Method | Endpoint | توضیح | Auth |
|--------|----------|-------|------|
| `POST` | `/signup` | ثبت‌نام کاربر جدید (ارسال OTP برای تایید ایمیل) | ❌ |
| `POST` | `/verify-email` | تایید ایمیل با OTP (بعد از signup) | ❌ |
| `POST` | `/login-password` | ورود با رمز عبور | ❌ |
| `POST` | `/request-otp` | درخواست OTP برای ورود | ❌ |
| `POST` | `/verify-otp` | تایید OTP و دریافت JWT | ❌ |
| `POST` | `/refresh` | تازه‌سازی access token | ❌ |

### Users (`/api/v1/users`)

| Method | Endpoint | توضیح | Auth |
|--------|----------|-------|------|
| `GET` | `/me` | دریافت پروفایل کاربر جاری | ✅ |
| `PATCH` | `/me` | ویرایش پروفایل | ✅ |
| `PUT` | `/me/password` | تغییر رمز عبور | ✅ |

### Communities (`/api/v1/communities`)

| Method | Endpoint | توضیح | Auth |
|--------|----------|-------|------|
| `GET` | `/` | لیست کامیونیتی‌ها (paginated) | ❌ |
| `POST` | `/` | ایجاد کامیونیتی جدید | ✅ |
| `GET` | `/{id}` | جزئیات کامیونیتی | ❌ |
| `PATCH` | `/{id}` | ویرایش کامیونیتی (owner/manager) | ✅ |
| `POST` | `/{id}/join` | درخواست عضویت | ✅ |
| `GET` | `/{id}/requests` | لیست درخواست‌های عضویت (manager) | ✅ |
| `POST` | `/{id}/requests/{req_id}/approve` | تایید درخواست (manager) | ✅ |
| `POST` | `/{id}/requests/{req_id}/reject` | رد درخواست (manager) | ✅ |
| `GET` | `/{id}/members` | لیست اعضا (paginated) | ❌ |

### Cards (`/api/v1/cards`)

| Method | Endpoint | توضیح | Auth |
|--------|----------|-------|------|
| `GET` | `/` | جست‌وجوی کارت‌ها با فیلتر (paginated) | ❌ |
| `POST` | `/` | ایجاد کارت جدید | ✅ |
| `GET` | `/{id}` | جزئیات کارت | ❌ |
| `PATCH` | `/{id}` | ویرایش کارت (owner only) | ✅ |
| `DELETE` | `/{id}` | حذف کارت (owner only) | ✅ |

**فیلترهای Cards**:
- `origin_city_id`, `destination_city_id`
- `is_sender` (true=فرستنده، false=مسافر)
- `product_classification_id`
- `is_packed` (وضعیت بسته‌بندی)
- `community_id`
- `min_weight`, `max_weight`

### Messages (`/api/v1/messages`)

| Method | Endpoint | توضیح | Auth | Rate Limit |
|--------|----------|-------|------|------------|
| `POST` | `/` | ارسال پیام | ✅ | 5/day |
| `GET` | `/inbox` | پیام‌های دریافتی (paginated) | ✅ | - |
| `GET` | `/sent` | پیام‌های ارسالی (paginated) | ✅ | - |

**نکته مهم**: ارسال پیام فقط با شرط کامیونیتی مشترک امکان‌پذیر است.

---

### مثال‌های استفاده

```bash
# Health check
curl http://localhost:8000/health

# مشاهده مستندات
open http://localhost:8000/docs

# ثبت‌نام
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# درخواست OTP
curl -X POST http://localhost:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# تایید OTP و دریافت JWT
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp_code": "123456"
  }'

# دریافت پروفایل (با JWT)
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# جست‌وجوی کارت‌ها
curl "http://localhost:8000/api/v1/cards/?origin_city_id=1&destination_city_id=2&is_sender=false"

# ایجاد کارت
curl -X POST http://localhost:8000/api/v1/cards/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_sender": false,
    "origin_country_id": 1,
    "origin_city_id": 1,
    "destination_country_id": 2,
    "destination_city_id": 10,
    "ticket_date_time": "2024-12-15T10:00:00",
    "weight": 5.0,
    "description": "می‌توانم بسته کوچک حمل کنم"
  }'
```

---

## 🛠️ Development

### اجرای تست‌ها

```bash
# تمام تست‌ها
pytest

# با coverage
pytest --cov=app --cov-report=html

# فقط یک فایل
pytest tests/services/test_auth_service.py

# با verbose
pytest -v
```

### Linting و Formatting

```bash
# Format با Black
black app/

# Sort imports با isort
isort app/

# Lint با Ruff
ruff check app/

# Type check با Mypy
mypy app/

# همه با یکبار
black app/ && isort app/ && ruff check app/ && mypy app/
```

### مایگریشن دیتابیس

```bash
# ساخت migration جدید
alembic revision --autogenerate -m "add user table"

# اجرای مایگریشن‌ها
alembic upgrade head

# بازگشت به نسخه قبل
alembic downgrade -1

# مشاهده تاریخچه
alembic history

# بررسی وضعیت فعلی
alembic current
```

### ساخت وابستگی جدید

```bash
# نصب پکیج جدید
pip install package-name

# به‌روزرسانی requirements.txt
pip freeze > requirements.txt

# یا با uv (سریع‌تر)
uv pip install package-name
uv pip freeze > requirements.txt
```

### دیدن لاگ‌ها

```bash
# لاگ‌های Docker Compose
docker-compose logs -f backend

# لاگ‌های محلی
# خروجی در console نمایش داده می‌شود
```

---

## 📁 ساختار پروژه

```
backend/
├── app/
│   ├── main.py              # نقطه ورود FastAPI
│   ├── api/                 # لایه API
│   │   ├── deps.py          # Dependencies
│   │   └── routers/         # Endpoints
│   ├── core/                # تنظیمات و امنیت
│   │   ├── config.py
│   │   ├── security.py
│   │   └── rate_limit.py
│   ├── models/              # ORM models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── repositories/        # Data access
│   └── utils/               # Helpers
├── alembic/                 # مایگریشن‌ها
├── tests/                   # تست‌ها
├── requirements.txt         # وابستگی‌ها
├── .env.example             # نمونه تنظیمات
├── docker-compose.yml       # Docker setup
├── Dockerfile               # تصویر Docker
├── README.md                # این فایل
└── ARCHITECTURE.md          # مستندات معماری
```

برای توضیحات جامع معماری، [ARCHITECTURE.md](./ARCHITECTURE.md) را ببینید.

---

## 🐛 عیب‌یابی (Troubleshooting)

### مشکل: پورت 8000 در حال استفاده است

```bash
# پیدا کردن process
lsof -i :8000

# کشتن process
kill -9 <PID>
```

### مشکل: دیتابیس اتصال ندارد

```bash
# بررسی Docker containers
docker-compose ps

# راه‌اندازی مجدد
docker-compose restart db

# مشاهده لاگ‌های PostgreSQL
docker-compose logs db
```

### مشکل: مایگریشن خطا می‌دهد

```bash
# حذف دیتابیس و شروع مجدد
docker-compose down -v
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

### مشکل: Import error

```bash
# اطمینان از فعال بودن venv
source venv/bin/activate

# نصب مجدد dependencies
pip install -r requirements.txt
```

---

## 📚 منابع مرتبط

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - معماری جامع backend
- **[SCOPE.md](../SCOPE.md)** - اسکوپ MVP پروژه
- **[ADR-20251030](../docs/ADR-20251030-layered-architecture.md)** - تصمیم معماری
- **[FastAPI Docs](https://fastapi.tiangolo.com/)** - مستندات FastAPI
- **[SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)** - مستندات SQLAlchemy

---

## 🤝 مشارکت

برای مشارکت در پروژه:

1. این قوانین را رعایت کنید: `.cursor/rules/`
2. از معماری لایه‌ای پیروی کنید
3. تست بنویسید
4. کامیت‌ها را با [Conventional Commits](https://www.conventionalcommits.org/) بنویسید
5. Pull request بسازید

---

## 📝 License

این پروژه تحت لایسنس MIT است.

---

## 📧 تماس

- **Repository**: [github.com/mahdiyarhamdi/Minila](https://github.com/mahdiyarhamdi/Minila)
- **Issues**: [github.com/mahdiyarhamdi/Minila/issues](https://github.com/mahdiyarhamdi/Minila/issues)

---

**نسخه**: 0.1.0  
**آخرین به‌روزرسانی**: 2025-11-02

