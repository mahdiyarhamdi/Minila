# ADR-20251210: پیاده‌سازی سیستم چندزبانه (i18n)

## مسأله

اپلیکیشن فقط به زبان فارسی بود و نیاز به پشتیبانی از سه زبان (انگلیسی، عربی، فارسی) داشت.

## گزینه‌ها

1. **next-intl**: کتابخانه محبوب با routing مبتنی بر locale
2. **react-i18next**: کتابخانه جامع با پیچیدگی بالا
3. **Custom React Context**: پیاده‌سازی سفارشی با Context API

## انتخاب

**Custom React Context** با فایل‌های JSON ترجمه

## چرا

- سادگی و کنترل کامل بر پیاده‌سازی
- عدم نیاز به URL routing با locale (طبق درخواست کاربر)
- SEO مهم نبود، پس نیازی به SSR locale handling نبود
- سبک‌تر و سریع‌تر از کتابخانه‌های بزرگ
- پشتیبانی ساده از RTL/LTR و فونت‌های متفاوت

## اثر بر آینده

- افزودن زبان جدید: ایجاد فایل `{locale}.json` در `/src/i18n/locales/` و اضافه کردن به `config.ts`
- ترجمه‌ها در build زمان load نمی‌شوند (client-side fetch)
- در صورت نیاز به SEO در آینده، باید به next-intl مهاجرت شود

## فایل‌های ایجاد شده

```
src/i18n/
├── config.ts              # تنظیمات زبان‌ها (code, dir, font)
└── locales/
    ├── en.json            # ترجمه‌های انگلیسی (پیش‌فرض)
    ├── ar.json            # ترجمه‌های عربی
    └── fa.json            # ترجمه‌های فارسی

src/contexts/
└── LanguageContext.tsx    # مدیریت state زبان + RTL/LTR

src/hooks/
└── useTranslation.ts      # Hook دسترسی به ترجمه‌ها

src/components/
└── LanguageSelector.tsx   # کامپوننت انتخاب زبان در Navbar

src/utils/
└── currency.ts            # واحدهای پول چندزبانه
```

## نحوه استفاده

### ترجمه متن

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, formatDate, formatNumber, language } = useTranslation();
  
  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <p>{t('dashboard.welcome', { name: 'علی' })}</p>
      <span>{formatDate(new Date())}</span>
      <span>{formatNumber(1234.56)}</span>
    </div>
  );
}
```

### واحد پول چندزبانه

```tsx
import { getCurrencyName, getCurrencyByCode, getCommonCurrencyOptions } from '@/utils/currency';
import { useTranslation } from '@/hooks/useTranslation';

function PriceDisplay({ amount, currencyCode }) {
  const { language } = useTranslation();
  const currency = getCurrencyByCode(currencyCode);
  
  return (
    <span>
      {amount.toLocaleString()} {getCurrencyName(currency, language)}
    </span>
  );
}

function CurrencySelect() {
  const { language } = useTranslation();
  const options = getCommonCurrencyOptions(language);
  
  return (
    <select>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
```

## صفحات چندزبانه شده

### صفحات اصلی
- ✅ صفحه لندینگ (`/`)
- ✅ احراز هویت (`/auth/login`, `/auth/signup`, `/auth/verify-email`)
- ✅ داشبورد (`/dashboard`)
- ✅ تغییر رمز عبور (`/dashboard/change-password`)
- ✅ پروفایل (`/dashboard/profile`)
- ✅ کاربران بلاک شده (`/dashboard/blocked-users`)

### کارت‌ها
- ✅ لیست کارت‌ها (`/cards`)
- ✅ جزئیات کارت (`/cards/[id]`)
- ✅ ایجاد کارت (`/cards/new`)
- ✅ ویرایش کارت (`/cards/[id]/edit`)
- ✅ کارت‌های من (`/dashboard/my-cards`)
- ✅ عضویت برای پیام (`/cards/[id]/join-community`)

### کامیونیتی‌ها
- ✅ لیست کامیونیتی‌ها (`/communities`)
- ✅ جزئیات کامیونیتی (`/communities/[id]`)
- ✅ ایجاد کامیونیتی (`/communities/new`)
- ✅ مدیریت کامیونیتی (`/communities/[id]/manage`)
- ✅ کامیونیتی‌های من (`/dashboard/my-communities`)

### پیام‌رسانی
- ✅ لیست مکالمات (`/messages`)
- ✅ صفحه چت (`/messages/[userId]`)

### سایر
- ✅ قوانین و مقررات (`/terms`)
- ⏳ پنل ادمین (در صورت نیاز)

## به‌روزرسانی‌ها

### 2025-12-11: واحدهای پول چندزبانه

- اضافه شدن `nameAr` به تمام واحدهای پول
- تابع `getCurrencyName(currency, language)` برای دریافت نام به زبان جاری
- تابع `getCommonCurrencyOptions(language)` برای گزینه‌های انتخاب واحد پول
- تابع `formatPriceWithName(amount, code, language)` برای فرمت قیمت با نام
- به‌روزرسانی تمام صفحاتی که قیمت نمایش می‌دهند
