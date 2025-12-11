# Minila Frontend

> Modern UI for Traveler & Cargo Coordination Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)](https://tailwindcss.com/)
[![i18n](https://img.shields.io/badge/i18n-EN%20|%20AR%20|%20FA-green)](.)

---

## 🎨 Design Features

- **Modern Notion-like Design**: Clean, minimal and user-friendly interface
- **Custom Color Palette**: Blue, beige and gray colors with perfect harmony
- **Mobile-First Design**: Optimized mobile-first with proper breakpoints
- **Responsive Design**: Compatible with mobile, tablet and desktop
- **RTL/LTR Support**: Full support for right-to-left and left-to-right languages
- **Tri-lingual**: English (default), Arabic, Persian
- **Dark Mode Ready**: Ready for dark mode support
- **Comprehensive Design System**: Documented in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- **Node.js 18+** ([دانلود](https://nodejs.org/))
- **npm یا yarn**
- **Backend در حال اجرا** (پورت 8000)

### راه‌اندازی پروژه

```bash
# 1. رفتن به پوشه frontend
cd frontend

# 2. نصب dependencies
npm install
# یا
yarn install

# 3. ساخت فایل .env.local
cp .env.example .env.local

# 4. اجرای سرور development
npm run dev
# یا
yarn dev
```

پروژه در `http://localhost:3000` در دسترس خواهد بود.

---

## 🌍 Internationalization (i18n)

The application supports three languages with automatic RTL/LTR switching:

| Language | Code | Direction | Font |
|----------|------|-----------|------|
| English (default) | `en` | LTR | IRANYekan |
| العربية | `ar` | RTL | IRANYekan |
| فارسی | `fa` | RTL | IRANYekan |

**Note**: All languages use the locally hosted IRANYekan font from `public/fonts/` for consistent typography.

### Language Selection
Users can change the language from the dropdown in the Navbar. The selection is persisted in `localStorage`.

### Adding Translations
1. Add translations to all files in `src/i18n/locales/`:
   - `en.json` (English)
   - `ar.json` (Arabic)  
   - `fa.json` (Persian)

2. Use the translation hook in components:

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, formatDate, formatNumber } = useTranslation();
  
  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <p>{t('dashboard.welcome', { name: 'Ali' })}</p>
      <span>{formatDate(new Date())}</span>
    </div>
  );
}
```

### RTL-Aware Styling
Use logical Tailwind properties for RTL compatibility:
- `text-start` / `text-end` instead of `text-left` / `text-right`
- `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- Use `locale.dir` from `useLanguage()` for conditional positioning

---

## 🌐 متغیرهای محیطی

فایل `.env.local` را بسازید:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 ساختار پروژه

```
frontend/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── auth/                        # صفحات احراز هویت
│   │   │   ├── login/                   # صفحه ورود + OTP
│   │   │   ├── signup/                  # صفحه ثبت‌نام
│   │   │   └── verify-email/            # تایید ایمیل
│   │   ├── cards/                       # صفحات کارت‌ها
│   │   │   ├── [id]/                    # جزئیات کارت
│   │   │   ├── new/                     # ایجاد کارت جدید
│   │   │   └── page.tsx                 # لیست کارت‌ها
│   │   ├── communities/                 # صفحات کامیونیتی‌ها
│   │   │   ├── [id]/                    # جزئیات و مدیریت
│   │   │   ├── new/                     # ایجاد کامیونیتی
│   │   │   └── page.tsx                 # لیست کامیونیتی‌ها
│   │   ├── messages/                    # صفحات پیام‌رسانی
│   │   │   ├── [userId]/                # چت با کاربر
│   │   │   └── page.tsx                 # لیست مکالمات
│   │   ├── dashboard/                   # داشبورد کاربر
│   │   │   ├── my-cards/                # کارت‌های من
│   │   │   ├── my-communities/          # کامیونیتی‌های من
│   │   │   ├── profile/                 # ویرایش پروفایل
│   │   │   ├── blocked-users/           # بلاک لیست
│   │   │   ├── change-password/         # تغییر رمز عبور
│   │   │   └── page.tsx                 # داشبورد اصلی
│   │   ├── terms/                       # صفحه قوانین و مقررات
│   │   ├── layout.tsx                   # Layout اصلی
│   │   ├── page.tsx                     # صفحه لندینگ اصلی
│   │   └── globals.css                  # استایل‌های سراسری
│   ├── components/                      # کامپوننت‌های قابل استفاده مجدد
│   │   ├── Button.tsx                   # دکمه
│   │   ├── Input.tsx                    # فیلد ورودی
│   │   ├── Card.tsx                     # کارت
│   │   ├── Select.tsx                   # انتخابگر
│   │   ├── Textarea.tsx                 # ناحیه متن
│   │   ├── DateTimePicker.tsx           # انتخابگر تاریخ و ساعت (با فیلدهای جداگانه)
│   │   ├── Autocomplete.tsx             # جستجوی خودکار
│   │   ├── Badge.tsx                    # نشان
│   │   ├── Modal.tsx                    # دیالوگ
│   │   ├── Tabs.tsx                     # تب‌ها
│   │   ├── Toast.tsx                    # نوتیفیکیشن
│   │   ├── Navbar.tsx                   # Navigation bar (اپلیکیشن)
│   │   ├── MobileBottomNav.tsx          # نوار ناوبری پایین موبایل
│   │   ├── ContentWrapper.tsx           # Wrapper برای padding هوشمند
│   │   ├── Logo.tsx                     # کامپوننت لوگو (icon/full)
│   │   ├── LanguageSelector.tsx         # Language picker dropdown
│   │   ├── EmptyState.tsx               # Empty state
│   │   ├── LoadingSpinner.tsx           # Loading spinner
│   │   ├── Providers.tsx                # Provider wrapper
│   │   ├── landing/                     # کامپوننت‌های صفحه لندینگ
│   │   │   ├── LandingNavbar.tsx        # نوار ناوبری لندینگ
│   │   │   ├── HeroSection.tsx          # بخش Hero با انیمیشن
│   │   │   ├── FeaturesSection.tsx      # معرفی ویژگی‌ها
│   │   │   ├── HowItWorks.tsx           # نحوه کار پلتفرم
│   │   │   ├── CardsCarousel.tsx        # کاروسل کارت‌ها
│   │   │   ├── CommunitiesCarousel.tsx  # کاروسل کامیونیتی‌ها
│   │   │   ├── StatsSection.tsx         # آمار پلتفرم
│   │   │   ├── CTASection.tsx           # دعوت به اقدام
│   │   │   └── Footer.tsx               # فوتر
│   │   ├── BottomSheet.tsx              # شیت پایین (برای موبایل)
│   │   ├── DateTimePicker.tsx           # انتخابگر تاریخ و زمان
│   │   ├── cards/                       # کامپوننت‌های کارت
│   │   │   ├── CardItem.tsx             # آیتم کارت
│   │   │   ├── FilterChip.tsx           # تگ فیلتر فعال
│   │   │   └── FilterPanel.tsx          # پنل فیلتر (موبایل‌فرندلی)
│   │   ├── communities/                 # کامپوننت‌های کامیونیتی
│   │   │   └── CommunityCard.tsx        # کارت کامیونیتی
│   │   └── messages/                    # کامپوننت‌های پیام
│   │       └── MessageBubble.tsx        # حباب پیام
│   ├── contexts/                        # React Contexts
│   │   ├── AuthContext.tsx              # Authentication state
│   │   └── LanguageContext.tsx          # i18n & RTL management
│   ├── hooks/                           # Custom React Hooks
│   │   ├── useAuth.ts                   # Authentication management
│   │   ├── useCards.ts                  # Cards management
│   │   ├── useCommunities.ts            # Communities management
│   │   ├── useMessages.ts               # Messages management
│   │   └── useTranslation.ts            # Translation hook
│   ├── i18n/                            # Internationalization
│   │   ├── config.ts                    # Language configuration
│   │   └── locales/                     # Translation files
│   │       ├── en.json                  # English (default)
│   │       ├── ar.json                  # Arabic
│   │       └── fa.json                  # Persian
│   ├── lib/                             # Utilities & Services
│   │   ├── api.ts                       # Full API service
│   │   ├── queryClient.ts               # TanStack Query client
│   │   └── utils.ts                     # Helper functions
│   └── types/                           # TypeScript Types
│       ├── auth.ts                      # Auth types
│       ├── card.ts                      # Card types
│       ├── community.ts                 # Community types
│       ├── location.ts                  # Location types
│       └── message.ts                   # Message types
├── public/                              # فایل‌های استاتیک
│   └── fonts/                           # فونت IRANYekan
├── package.json                         # Dependencies
├── tsconfig.json                        # پیکربندی TypeScript
├── tailwind.config.js                   # پیکربندی Tailwind
└── next.config.js                       # پیکربندی Next.js
```

---

## 🎯 صفحات پیاده‌سازی شده

### ✅ صفحه لندینگ (`/`)
- Hero Section با انیمیشن floating icons
- معرفی ویژگی‌های پلتفرم (Features)
- نحوه کار در 3 مرحله (How It Works)
- کاروسل کارت‌های اخیر
- کاروسل کامیونیتی‌های فعال
- آمار پلتفرم با انیمیشن count-up
- بخش CTA (دعوت به ثبت‌نام)
- فوتر کامل با لینک‌ها و شبکه‌های اجتماعی
- پشتیبانی کامل RTL/LTR
- Responsive برای موبایل

### ✅ صفحه قوانین و مقررات (`/terms`)
- نمایش قوانین و مقررات پلتفرم
- پشتیبانی چندزبانه
- طراحی هماهنگ با صفحات auth

### ✅ احراز هویت

#### ورود (`/auth/login`)
- فرم ورود با ایمیل
- درخواست و تایید کد OTP
- Validation کامل با Zod
- پیام‌های خطا و موفقیت

#### ثبت‌نام (`/auth/signup`)
- فرم ثبت‌نام با تمام فیلدها
- اعتبارسنجی رمز عبور
- تایید یکسان بودن رمز عبور
- انتقال خودکار به صفحه ورود

#### تایید ایمیل (`/auth/verify-email`)
- دریافت و تایید کد OTP از ایمیل
- هدایت به داشبورد پس از تایید

### ✅ داشبورد (`/dashboard`)
- نمایش اطلاعات کاربر
- **بخش آنبوردینگ/آموزش**: نمایش 4 مرحله کار با اپلیکیشن
- کارت‌های آماری (کارت‌ها، پیام‌ها، کامیونیتی‌ها)
- دسترسی سریع به عملکردها
- تغییر رمز عبور
- دکمه خروج

### ✅ کارت‌ها

#### لیست کارت‌ها (`/cards`)
- نمایش همه کارت‌های سفر/بار
- فیلتر پیشرفته (مبدأ، مقصد، تاریخ، ظرفیت، دسته‌بندی، بسته‌بندی)
- Pagination
- دکمه شناور ایجاد کارت
- Responsive grid layout

#### جزئیات کارت (`/cards/[id]`)
- نمایش تمام اطلاعات کارت
- اطلاعات صاحب کارت
- دکمه ارسال پیام (برای غیر صاحبان)
- بررسی کامیونیتی مشترک قبل از هدایت به صفحه پیام
- دکمه‌های ویرایش/حذف (برای صاحب)
- لیست کامیونیتی‌های مرتبط

#### صفحه عضویت (`/cards/[id]/join-community`)
- نمایش هنگامی که کاربر کامیونیتی مشترکی با صاحب کارت ندارد
- لیست تمام کامیونیتی‌های صاحب کارت
- امکان ارسال درخواست عضویت به هر کامیونیتی
- نمایش وضعیت عضویت (عضو، در انتظار تأیید)
- توضیحات درباره چرایی نیاز به کامیونیتی مشترک

#### ایجاد کارت (`/cards/new`)
- فرم کامل با تمام فیلدها
- انتخابگر تاریخ و ساعت سفارشی (سال، ماه، روز، ساعت، دقیقه)
- انتخاب کامیونیتی‌ها (اختیاری)
- Validation (صحت تاریخ، بررسی تاریخ‌های گذشته)
- پیش‌نمایش و ثبت

#### کارت‌های من (`/dashboard/my-cards`)
- لیست کارت‌های خودم
- تب‌بندی: همه، فعال، منقضی شده
- دکمه‌های سریع ویرایش/حذف
- حذف با تایید

### ✅ کامیونیتی‌ها

#### لیست کامیونیتی‌ها (`/communities`)
- نمایش همه کامیونیتی‌ها
- جست‌وجو
- Badge برای کامیونیتی‌های عضو
- دکمه ایجاد کامیونیتی

#### جزئیات کامیونیتی (`/communities/[id]`)
- اطلاعات کامل کامیونیتی
- تب‌ها: درباره، اعضا
- دکمه درخواست عضویت
- دکمه مدیریت (برای Manager)

#### ایجاد کامیونیتی (`/communities/new`)
- فرم ساده با نام و توضیحات
- سازنده به‌عنوان Manager
- هدایت به صفحه کامیونیتی پس از ایجاد

#### مدیریت کامیونیتی (`/communities/[id]/manage`)
- تب درخواست‌ها: تایید/رد عضویت
- تب اعضا: مشاهده و حذف اعضا
- تب تنظیمات: ویرایش اطلاعات
- فقط برای Manager

#### کامیونیتی‌های من (`/dashboard/my-communities`)
- لیست کامیونیتی‌هایی که عضو هستم
- نمایش نقش (عضو/مدیر)
- دسترسی سریع به مدیریت

### ✅ پیام‌رسانی

#### لیست مکالمات (`/messages`)
- نمایش تمام مکالمات
- آخرین پیام و زمان
- Badge تعداد پیام‌های خوانده نشده
- جست‌وجو در مکالمات

#### صفحه چت (`/messages/[userId]`)
- نمایش پیام‌ها به صورت real-time
- حباب‌های پیام (خودی/طرف مقابل)
- ارسال پیام با Enter
- Scroll خودکار به آخرین پیام

### ✅ پروفایل

#### ویرایش پروفایل (`/dashboard/profile`)
- ویرایش نام و نام خانوادگی
- نمایش اطلاعات حساب
- Placeholder برای آپلود عکس

#### بلاک لیست (`/dashboard/blocked-users`)
- لیست کاربران بلاک شده
- دکمه آنبلاک
- حذف با تایید

---

## 🛠️ تکنولوژی‌ها

### Core
- **Next.js 14**: React Framework با App Router
- **React 18**: کتابخانه UI
- **TypeScript**: Type Safety

### Styling
- **TailwindCSS**: Utility-first CSS
- **clsx + tailwind-merge**: ترکیب class‌ها

### Forms & Validation
- **react-hook-form**: مدیریت فرم
- **zod**: Schema validation
- **@hookform/resolvers**: اتصال zod و react-hook-form

### API & State
- **Axios**: HTTP client
- **@tanstack/react-query**: Server state management و caching

---

## 🎨 پالت رنگی

### Primary (آبی)
- `primary-500`: `#00A8E8` - رنگ اصلی
- `primary-600`: `#0098D9` - hover states
- `primary-700`: `#007EA7` - active states

### Sand (بژ/طلایی)
- `sand-300`: `#E5C189`
- `sand-400`: `#D4AF89`

### Neutral (خاکستری)
- `neutral-50` تا `neutral-900`: تدرج خاکستری

---

## 📝 API Endpoints استفاده شده

### Authentication
| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/api/v1/auth/signup` | POST | ثبت‌نام کاربر جدید |
| `/api/v1/auth/request-otp` | POST | درخواست کد OTP |
| `/api/v1/auth/verify-otp` | POST | تایید OTP و دریافت token |
| `/api/v1/auth/verify-email` | POST | تایید ایمیل |
| `/api/v1/auth/login-password` | POST | ورود با رمز عبور |
| `/api/v1/auth/refresh` | POST | تازه‌سازی token |

### User
| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/api/v1/users/me` | GET | دریافت اطلاعات کاربر |
| `/api/v1/users/me` | PUT | ویرایش پروفایل |
| `/api/v1/users/me/password` | PUT | تغییر رمز عبور |
| `/api/v1/users/me/blocked` | GET | لیست کاربران بلاک شده |
| `/api/v1/users/block/{userId}` | POST | بلاک کاربر |
| `/api/v1/users/block/{userId}` | DELETE | آنبلاک کاربر |
| `/api/v1/users/{userId}/shared-communities` | GET | بررسی کامیونیتی مشترک با کاربر |
| `/api/v1/users/{userId}/communities` | GET | دریافت کامیونیتی‌های یک کاربر |

### Cards
| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/api/v1/cards` | GET | دریافت لیست کارت‌ها با فیلتر |
| `/api/v1/cards` | POST | ایجاد کارت جدید |
| `/api/v1/cards/{id}` | GET | دریافت جزئیات کارت |
| `/api/v1/cards/{id}` | PUT | ویرایش کارت |
| `/api/v1/cards/{id}` | DELETE | حذف کارت |
| `/api/v1/users/me/cards` | GET | دریافت کارت‌های من |

### Communities
| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/api/v1/communities` | GET | دریافت لیست کامیونیتی‌ها |
| `/api/v1/communities` | POST | ایجاد کامیونیتی جدید |
| `/api/v1/communities/{id}` | GET | دریافت جزئیات کامیونیتی |
| `/api/v1/communities/{id}` | PUT | ویرایش کامیونیتی |
| `/api/v1/communities/{id}/join` | POST | درخواست عضویت |
| `/api/v1/communities/{id}/members` | GET | دریافت اعضا |
| `/api/v1/communities/{id}/members/{userId}` | DELETE | حذف عضو |
| `/api/v1/communities/{id}/requests` | GET | دریافت درخواست‌های عضویت |
| `/api/v1/communities/{id}/requests/{requestId}/approve` | POST | تایید درخواست |
| `/api/v1/communities/{id}/requests/{requestId}/reject` | POST | رد درخواست |
| `/api/v1/users/me/communities` | GET | دریافت کامیونیتی‌های من |

### Messages
| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/api/v1/messages/conversations` | GET | دریافت لیست مکالمات |
| `/api/v1/messages` | POST | ارسال پیام |
| `/api/v1/messages/{userId}` | GET | دریافت پیام‌ها با کاربر |
| `/api/v1/messages/{messageId}/read` | PUT | علامت‌گذاری به عنوان خوانده شده |

---

## 🧪 Development

### اجرای سرور توسعه

```bash
npm run dev
```

### Build برای production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 🔐 Authentication Flow

1. **ثبت‌نام**: کاربر اطلاعات خود را وارد می‌کند → حساب ایجاد می‌شود
2. **درخواست OTP**: کاربر ایمیل خود را وارد می‌کند → کد 6 رقمی ارسال می‌شود
3. **تایید OTP**: کاربر کد را وارد می‌کند → JWT tokens دریافت می‌شود
4. **ذخیره Token**: Tokens در localStorage ذخیره می‌شوند
5. **دسترسی به Dashboard**: کاربر به داشبورد هدایت می‌شود

---

## 🌟 Recently Implemented Features

- [x] **Mobile Bottom Navigation**: نوار ناوبری پایین صفحه برای موبایل با badge پیام‌ها
- [x] **Dashboard Tutorial Section**: بخش آنبوردینگ گرافیکی در داشبورد
- [x] **Smart Logo Navigation**: کلیک روی لوگو به لندینگ می‌رود
- [x] **Landing Auth-aware Navbar**: نمایش دکمه داشبورد برای کاربران لاگین شده
- [x] **Tri-lingual Support**: Full i18n with English (default), Arabic, Persian
- [x] **RTL/LTR Auto-switching**: Automatic direction change based on language
- [x] **Unified Font**: IRANYekan for all languages (local files)
- [x] **Locale-aware Formatting**: Dates, numbers with proper localization
- [x] **Mobile-First Redesign**: Complete redesign of 20+ pages for mobile
- [x] **Design System**: Comprehensive design system (`DESIGN_SYSTEM.md`)
- [x] **Professional Landing Page**: Hero, Features, How It Works, Carousels, Stats, CTA, Footer
- [x] **Terms & Conditions Page**: Multi-language legal page
- [x] **Logo Component**: Reusable logo component with icon/full variants
- [x] **Language Selector on Auth Pages**: Language switching on login/signup
- [x] **Horizontal Scroll Tabs**: Horizontal scrolling for tabs on mobile
- [x] **Responsive Layouts**: Responsive grids with `grid-cols-1 → md:grid-cols-2`
- [x] Custom date/time picker with separate fields
- [x] Past date validation for traveler and sender cards
- [x] Circular behavior for day, hour and minute fields
- [x] Gregorian calendar support with localized month names
- [x] **Shared Community Check**: Auto-check for shared community before messaging
- [x] **Join Community Page**: Redirect to join page if no shared community

## 🌟 Upcoming Features

- [ ] Real-time notifications
- [ ] Image upload for cards
- [ ] Map for location selection

---

## 📚 منابع مفید

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

---

## 🤝 مشارکت

برای مشارکت در پروژه:
1. کد را مطابق با استانداردهای موجود بنویسید
2. از TypeScript و type safety استفاده کنید
3. کامپوننت‌ها را قابل استفاده مجدد نگه دارید
4. از Tailwind classes استفاده کنید

---

**Version**: 0.5.0  
**Last Update**: 2025-12-11

