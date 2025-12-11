# Changelog

تمام تغییرات قابل توجه در این پروژه در این فایل ثبت می‌شود.

## [Unreleased]

### Added - 2024-12-11

#### Frontend - Mobile Navigation & UX Improvements

**MobileBottomNav Component**:
- اضافه شدن نوار ناوبری پایین صفحه برای موبایل (`MobileBottomNav.tsx`)
- شامل 4 آیتم: داشبورد، کارت‌ها، کامیونیتی‌ها، پیام‌ها
- آیکون‌های filled برای حالت فعال
- نمایش Badge تعداد پیام‌های خوانده نشده
- پشتیبانی از safe-area برای iPhone
- نمایش فقط برای کاربران لاگین شده (حتی در صفحه لندینگ)

**ContentWrapper Component**:
- اضافه شدن wrapper برای مدیریت هوشمند padding پایین صفحه
- padding فقط وقتی bottom nav نمایش داده می‌شود اضافه می‌شود

**Dashboard Tutorial Section**:
- اضافه شدن بخش آنبوردینگ/آموزش در داشبورد
- نمایش 4 مرحله کار با اپلیکیشن با آیکون‌های گرافیکی
- فلش‌های جهت‌دار بین مراحل (در دسکتاپ)
- طراحی کارت‌های شیشه‌ای با گرادیانت
- لینک مستقیم به هر بخش مربوطه
- پشتیبانی کامل RTL/LTR

### Changed - 2024-12-11

**Logo Navigation**:
- کلیک روی لوگو در همه صفحات حالا به صفحه لندینگ (`/`) منتقل می‌کند
- قبلاً در Navbar به داشبورد می‌رفت

**Landing Navbar**:
- اگر کاربر لاگین باشد، دکمه "داشبورد" نمایش داده می‌شود
- اگر لاگین نباشد، دکمه‌های "ورود" و "ثبت‌نام" نمایش داده می‌شوند

**Main Navbar (Mobile)**:
- حذف لینک‌های ناوبری اصلی (داشبورد، کارت‌ها، ...) از منوی همبرگری
- این لینک‌ها به bottom nav منتقل شدند
- منوی همبرگری فقط شامل پروفایل/تنظیمات/خروج

**Translations**:
- اضافه شدن ترجمه‌های بخش tutorial در هر سه زبان (fa, en, ar)

**تغییرات فایل‌ها**:
- `frontend/src/components/MobileBottomNav.tsx` (جدید)
- `frontend/src/components/ContentWrapper.tsx` (جدید)
- `frontend/src/components/Navbar.tsx`
- `frontend/src/components/landing/LandingNavbar.tsx`
- `frontend/src/components/Logo.tsx` (استفاده‌کنندگان آپدیت شدند)
- `frontend/src/app/layout.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/globals.css` (safe-area-bottom)
- `frontend/src/i18n/locales/*.json`

---

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

