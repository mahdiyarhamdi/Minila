# Changelog

تمام تغییرات قابل توجه در این پروژه در این فایل ثبت می‌شود.

## [Unreleased]

### Fixed - 2024-11-24

#### Frontend - Message Display UI

**مشکل**: پیام‌ها در صفحه چت به درستی نمایش داده نمی‌شدند:
- جهت پیام‌ها (چپ/راست) برعکس بود
- رنگ‌های پیام‌ها اشتباه بود
- جدیدترین پیام‌ها بالای صفحه نمایش داده می‌شدند

**راه‌حل**:
- رفع منطق جهت‌دهی در `MessageBubble` component با توجه به RTL layout
  - `isOwn` پیام‌ها: `justify-start` (راست در RTL) + رنگ آبی
  - پیام‌های طرف مقابل: `justify-end` (چپ در RTL) + رنگ طوسی
- معکوس کردن آرایه پیام‌ها در frontend برای نمایش جدیدترین‌ها در پایین
- اصلاح timestamp alignment (راست برای isOwn، چپ برای other)
- اصلاح border-radius گوشه‌ها (`rounded-br-sm` برای راست، `rounded-bl-sm` برای چپ)

**تغییرات فایل‌ها**:
- `frontend/src/components/messages/MessageBubble.tsx`: رفع منطق RTL
- `frontend/src/app/messages/[userId]/page.tsx`: reverse کردن آرایه پیام‌ها
- `frontend/__tests__/components/MessageBubble.test.tsx`: تست‌های کامل component

#### Frontend - Type Consistency

**مشکل**: تناقض در تایپ `User.id` بین backend و frontend
- Backend: `id: int` (number) 
- Frontend: `id: string`
- این باعث می‌شد مقایسه‌ها (`message.sender.id === user?.id`) همیشه `false` برگردانند

**راه‌حل**:
- تغییر `User.id` از `string` به `number` در `frontend/src/types/auth.ts`
- حذف تبدیل‌های غیرضروری `parseInt()` و `Number()` در تمام فایل‌ها
- استفاده از `message.sender.id` به جای `message.sender_id` (مطابق با schema backend)

**تغییرات فایل‌ها**:
- `frontend/src/types/auth.ts`: `User.id` از `string` به `number`
- `frontend/src/app/messages/[userId]/page.tsx`: حذف `parseInt()` و استفاده از `sender.id`
- `frontend/src/app/cards/[id]/page.tsx`: حذف `.toString()`
- `frontend/src/app/communities/[id]/page.tsx`: حذف `parseInt()`
- `frontend/src/app/dashboard/blocked-users/page.tsx`: حذف `parseInt()`

### Testing

- افزوده شد: تست‌های جامع برای `MessageBubble` component (14 test cases)
  - تست رنگ‌ها (آبی برای isOwn، طوسی برای other)
  - تست جهت‌دهی (راست/چپ با توجه به RTL)
  - تست نمایش sender name
  - تست border-radius گوشه‌ها
  - تست timestamp formatting و alignment
  - تست content rendering (whitespace, line breaks, word breaking)

---

## نحوه استفاده از Changelog

این فایل بر اساس [Keep a Changelog](https://keepachangelog.com/fa/1.0.0/) نوشته شده است.

### دسته‌بندی‌ها:
- **Added**: ویژگی‌های جدید
- **Changed**: تغییرات در ویژگی‌های موجود
- **Deprecated**: ویژگی‌هایی که به زودی حذف می‌شوند
- **Removed**: ویژگی‌های حذف شده
- **Fixed**: رفع باگ‌ها
- **Security**: رفع آسیب‌پذیری‌های امنیتی

