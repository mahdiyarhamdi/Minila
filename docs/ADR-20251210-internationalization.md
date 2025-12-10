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
```

## نحوه استفاده

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, formatDate, formatNumber } = useTranslation();
  
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

