# Release Notes v0.3.0 - سیستم وضعیت پیام و Read Receipts

**تاریخ انتشار**: 2025-11-24  
**نوع**: Feature Release

---

## 🎯 خلاصه تغییرات

این نسخه شامل پیاده‌سازی کامل **سیستم وضعیت پیام‌ها** و **Read Receipts** است که تجربه کاربری پیام‌رسانی را به سطح بالاتری می‌برد.

---

## ✨ ویژگی‌های جدید

### 1. سیستم وضعیت پیام (Message Status)

پیام‌ها حالا دارای 3 وضعیت هستند:

- **Pending** (⏳): در حال ارسال (فقط در frontend)
- **Sent** (✓): ارسال شده اما خوانده نشده
- **Delivered** (✓✓): خوانده شده توسط گیرنده

#### Backend:
- فیلد `status` در مدل `Message`
- مقادیر: `"pending"`, `"sent"`, `"delivered"`

#### Frontend:
- آیکون‌های بصری برای هر وضعیت در `MessageBubble`
- Optimistic UI برای نمایش فوری پیام‌های در حال ارسال

### 2. Read Receipts (تایید خواندن)

#### Backend:
- فیلد `is_read` (Boolean): آیا پیام خوانده شده
- فیلد `read_at` (DateTime): زمان دقیق خواندن
- Endpoint جدید: `POST /api/v1/messages/mark-read/{user_id}`
- تابع جدید: `mark_as_read()` در repository

#### Frontend:
- خواندن خودکار پیام‌ها هنگام باز کردن مکالمه
- آپدیت فوری وضعیت پیام بعد از خواندن

### 3. Unread Count Badge در Navbar

#### Backend:
- Endpoint جدید: `GET /api/v1/messages/unread-count`
- محاسبه واقعی تعداد پیام‌های خوانده نشده

#### Frontend:
- Badge قرمز در Navbar کنار منوی "پیام‌ها"
- Auto-refresh هر 30 ثانیه
- Refetch خودکار بعد از login
- نمایش "99+" برای اعداد بیش از 99

### 4. افزایش محدودیت پیام روزانه

- **قبل**: 5 پیام/روز
- **بعد**: 50 پیام/روز
- پیام خطای کاربرپسندتر برای rate limit

---

## 🔧 تغییرات فنی

### Database (Migration 003)

```sql
ALTER TABLE message ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE message ADD COLUMN read_at TIMESTAMP;
ALTER TABLE message ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
CREATE INDEX ix_message_is_read ON message(is_read);
```

### Backend Files Modified

1. **Models**:
   - `app/models/message.py`: افزودن 3 فیلد جدید

2. **Schemas**:
   - `app/schemas/message.py`: آپدیت `MessageOut` و `LastMessageInfo`

3. **Repository**:
   - `app/repositories/message_repo.py`:
     - `mark_as_read()`: علامت‌گذاری پیام‌ها به عنوان خوانده شده
     - `get_total_unread_count()`: تعداد کل خوانده نشده
     - `get_conversations()`: محاسبه واقعی unread_count

4. **Service**:
   - `app/services/message_service.py`:
     - `mark_conversation_as_read()`: با لاگ و validation
     - `get_total_unread_count()`: wrapper

5. **API**:
   - `app/api/routers/messages.py`:
     - `POST /mark-read/{user_id}`: علامت‌گذاری به عنوان خوانده شده
     - `GET /unread-count`: دریافت تعداد خوانده نشده

6. **Config**:
   - `app/core/config.py`: `MESSAGES_PER_DAY = 50`
   - `app/core/rate_limit.py`: پیام خطای کاربرپسند فارسی

### Frontend Files Modified

1. **Types**:
   - `types/message.ts`: افزودن `is_read`, `read_at`, `status`

2. **API Service**:
   - `lib/api.ts`:
     - `markConversationAsRead(userId)`
     - `getUnreadMessagesCount()`

3. **Hooks**:
   - `hooks/useMessages.ts`:
     - `useMarkAsRead()`: آپدیت شده
     - `useUnreadCount()`: جدید با auto-refresh

4. **Components**:
   - `components/messages/MessageBubble.tsx`: نمایش آیکون‌های status
   - `components/Navbar.tsx`: نمایش unread badge
   - `app/messages/[userId]/page.tsx`: خواندن خودکار
   - `app/messages/page.tsx`: نمایش unread count

5. **Utils**:
   - `utils/errors.ts`: پیام خطای بهتر برای 429

---

## 📊 API Changes

### New Endpoints

```
POST   /api/v1/messages/mark-read/{user_id}    # علامت‌گذاری پیام‌ها
GET    /api/v1/messages/unread-count           # تعداد خوانده نشده
```

### Modified Response Schemas

**MessageOut** (قبل):
```json
{
  "id": 1,
  "sender": {...},
  "receiver": {...},
  "body": "text",
  "created_at": "2025-11-24T10:00:00"
}
```

**MessageOut** (بعد):
```json
{
  "id": 1,
  "sender": {...},
  "receiver": {...},
  "body": "text",
  "created_at": "2025-11-24T10:00:00",
  "is_read": false,
  "read_at": null,
  "status": "sent"
}
```

**ConversationOut**:
- `unread_count` حالا واقعی است (قبلاً همیشه 0 بود)

---

## 🧪 Tests

### New Test Classes

- `TestGetUnreadCount`: 4 تست جامع برای unread count
  - تست بدون پیام
  - تست با پیام‌های خوانده نشده
  - تست بعد از mark as read
  - تست نیاز به authentication

### Test Coverage

- ✅ Repository layer: `mark_as_read()`, `get_total_unread_count()`
- ✅ Service layer: `mark_conversation_as_read()`, `get_total_unread_count()`
- ✅ API endpoints: `/mark-read/{user_id}`, `/unread-count`

---

## 📚 Documentation Updates

- `backend/README.md`: جدول API endpoints و env vars
- `backend/ARCHITECTURE.md`: version bump
- `backend/env.example`: MESSAGES_PER_DAY=50
- `UNREAD_BADGE_GUIDE.md`: راهنمای کامل تست badge (جدید)

---

## 🔄 Migration Guide

### برای توسعه‌دهندگان:

1. **اجرای Migration**:
```bash
cd backend
alembic upgrade head
```

2. **Restart Backend**:
```bash
docker-compose restart backend
```

3. **Frontend**:
```bash
cd frontend
npm run dev
# یا hard refresh در مرورگر
```

### برای کاربران:

- نیازی به اقدام خاصی نیست
- Badge خودکار در Navbar ظاهر می‌شود
- پیام‌های قدیمی به صورت خودکار status="sent" دارند

---

## ⚠️ Breaking Changes

**هیچ breaking change وجود ندارد!**

همه تغییرات backward-compatible هستند:
- فیلدهای جدید مقادیر پیش‌فرض دارند
- API‌های قدیمی همچنان کار می‌کنند
- Frontend با backend قدیمی هم کار می‌کند (با fallback)

---

## 🐛 Bug Fixes

- ✅ Route ordering در messages endpoints (unread-count قبل از {user_id})
- ✅ Refetch unread count بعد از login بدون نیاز به refresh
- ✅ پیام خطای کاربرپسند برای rate limit (429)

---

## 🎨 UI/UX Improvements

- آیکون‌های بصری واضح برای وضعیت پیام‌ها
- Badge قرمز چشمگیر برای پیام‌های خوانده نشده
- نمایش "99+" برای اعداد بزرگ
- Bold کردن مکالمات با پیام خوانده نشده
- پیام‌های خطای فارسی و قابل فهم

---

## 📈 Performance

- Auto-refresh هر 30 ثانیه (قابل تنظیم)
- Index جدید روی `is_read` برای کوئری سریع
- Optimistic UI برای تجربه سریع‌تر

---

## 🔜 Future Enhancements

پیشنهادات برای نسخه‌های آینده:

- [ ] Real-time notifications با WebSocket
- [ ] Push notifications
- [ ] "در حال تایپ..." indicator
- [ ] Delivery receipts (تایید دریافت)
- [ ] پشتیبانی از تصویر و فایل در پیام‌ها
- [ ] گروه‌های پیامی

---

## 🙏 Credits

توسعه داده شده توسط تیم Minila  
تاریخ: نوامبر 2025

---

## 📝 Changelog Summary

```
Added:
- Message status system (pending/sent/delivered)
- Read receipts (is_read, read_at)
- Unread count badge in Navbar
- Auto mark as read on conversation open
- New endpoints: /mark-read/{user_id}, /unread-count
- Migration 003

Changed:
- MESSAGES_PER_DAY: 5 → 50
- Rate limit error messages (user-friendly Persian)
- MessageOut schema (added new fields)
- ConversationOut (real unread_count)

Fixed:
- Route ordering issue in messages router
- Refetch after login
- Error message display

Improved:
- Message bubble icons
- Navbar badge visibility
- User experience in messaging
```

---

**برای اطلاعات بیشتر، به `UNREAD_BADGE_GUIDE.md` مراجعه کنید.**

