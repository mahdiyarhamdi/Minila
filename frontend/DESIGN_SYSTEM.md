# سیستم طراحی Minila (Design System)

**نسخه**: 1.0.0  
**آخرین به‌روزرسانی**: 2025-11-29

---

## 📋 فهرست مطالب

1. [اصول کلی](#-اصول-کلی)
2. [پالت رنگی](#-پالت-رنگی)
3. [تایپوگرافی](#-تایپوگرافی)
4. [فاصله‌گذاری (Spacing)](#-فاصله‌گذاری-spacing)
5. [سایه‌ها و گوشه‌ها](#-سایه‌ها-و-گوشه‌ها)
6. [Breakpoints و Responsive](#-breakpoints-و-responsive)
7. [کامپوننت‌ها](#-کامپوننت‌ها)
8. [الگوهای Layout](#-الگوهای-layout)
9. [آیکون‌ها](#-آیکون‌ها)
10. [انیمیشن‌ها](#-انیمیشن‌ها)
11. [دسترسی‌پذیری (Accessibility)](#-دسترسی‌پذیری-accessibility)

---

## 🎯 اصول کلی

### فلسفه طراحی
- **Notion-like**: مینیمال، تمیز، حرفه‌ای
- **Mobile-First**: همیشه ابتدا برای موبایل طراحی کن
- **RTL-Native**: طراحی بومی راست به چپ برای فارسی
- **Consistent**: یکپارچگی در تمام صفحات و کامپوننت‌ها

### قوانین کلیدی
1. فضای سفید کافی برای تنفس بصری
2. کنتراست رنگی مناسب برای خوانایی
3. سلسله مراتب بصری واضح
4. تعاملات پاسخگو و سریع

---

## 🎨 پالت رنگی

### Primary (آبی - رنگ اصلی برند)

| Token | Hex | کاربرد |
|-------|-----|--------|
| `primary-50` | `#E6F7FF` | پس‌زمینه hover خفیف |
| `primary-100` | `#BAE7FF` | پس‌زمینه آیتم‌های فعال |
| `primary-200` | `#91D5FF` | بوردر focus |
| `primary-300` | `#69C0FF` | آیکون‌های غیرفعال |
| `primary-400` | `#40A9FF` | لینک‌های hover |
| `primary-500` | `#00A8E8` | **رنگ اصلی برند** |
| `primary-600` | `#0098D9` | دکمه‌های اصلی |
| `primary-700` | `#007EA7` | دکمه hover |
| `primary-800` | `#005F7F` | متن تأکیدی |
| `primary-900` | `#003D52` | متن تیره |

```tsx
// استفاده در کد
<button className="bg-primary-600 hover:bg-primary-700">دکمه</button>
<span className="text-primary-600">متن آبی</span>
```

### Sand (بژ/طلایی - رنگ ثانویه)

| Token | Hex | کاربرد |
|-------|-----|--------|
| `sand-50` | `#FAF7F2` | پس‌زمینه گرم |
| `sand-100` | `#F5EFE6` | کارت‌های ویژه |
| `sand-200` | `#ECE0C8` | بوردر گرم |
| `sand-300` | `#E5C189` | **رنگ اصلی بژ** |
| `sand-400` | `#D4AF89` | آیکون‌های کامیونیتی |
| `sand-500` | `#C19A6B` | badge‌ها |
| `sand-600` | `#A8864F` | آیکون‌های تیره |
| `sand-700` | `#8F7238` | متن تأکیدی |
| `sand-800` | `#6B5427` | متن تیره |

```tsx
// استفاده در کد
<div className="bg-sand-100">پس‌زمینه گرم</div>
<span className="text-sand-600">آیکون کامیونیتی</span>
```

### Neutral (خاکستری - متن و پس‌زمینه)

| Token | Hex | کاربرد |
|-------|-----|--------|
| `neutral-50` | `#FAFAFA` | **پس‌زمینه اصلی** |
| `neutral-100` | `#F5F5F5` | پس‌زمینه کارت‌ها |
| `neutral-200` | `#E5E5E5` | بوردرها |
| `neutral-300` | `#D4D4D4` | بوردر غیرفعال |
| `neutral-400` | `#A3A3A3` | placeholder |
| `neutral-500` | `#737373` | متن کم‌رنگ |
| `neutral-600` | `#525252` | **متن ثانویه** |
| `neutral-700` | `#404040` | متن معمولی |
| `neutral-800` | `#2C2C2C` | متن مهم |
| `neutral-900` | `#1A1A1A` | **متن اصلی** |

```tsx
// استفاده در کد
<body className="bg-neutral-50 text-neutral-900">
<p className="text-neutral-600">متن توضیحی</p>
```

### رنگ‌های وضعیت (Semantic Colors)

| وضعیت | رنگ پس‌زمینه | رنگ متن | کاربرد |
|-------|--------------|---------|--------|
| Success | `green-100` | `green-700` | تأیید، موفقیت |
| Warning | `yellow-100` | `yellow-700` | هشدار |
| Error | `red-100` | `red-700` | خطا |
| Info | `blue-100` | `blue-700` | اطلاعات |

---

## 📝 تایپوگرافی

### فونت اصلی
**IRANYekan** - فونت فارسی مدرن و خوانا

### وزن‌های فونت

| وزن | کلاس | کاربرد |
|-----|------|--------|
| Thin (100) | `font-thin` | تزئینی (کم‌استفاده) |
| Light (300) | `font-light` | توضیحات، helper text |
| Regular (400) | `font-normal` | **متن اصلی** |
| Medium (500) | `font-medium` | دکمه‌ها، لیبل‌ها |
| SemiBold (600) | `font-semibold` | عنوان‌های کوچک |
| Bold (700) | `font-bold` | **عنوان‌های اصلی** |
| ExtraBold (800) | `font-extrabold` | Hero headings |
| Black (900) | `font-black` | **لوگو** |

### اندازه‌های متن

| سایز | کلاس | استفاده |
|------|------|---------|
| xs | `text-xs` (12px) | Badge، timestamp |
| sm | `text-sm` (14px) | Helper text، caption |
| base | `text-base` (16px) | **متن اصلی** |
| lg | `text-lg` (18px) | عنوان کارت |
| xl | `text-xl` (20px) | عنوان بخش |
| 2xl | `text-2xl` (24px) | عنوان صفحه |
| 3xl | `text-3xl` (30px) | **Hero title** |
| 5xl | `text-5xl` (48px) | لوگو |

### سلسله مراتب متن

```tsx
// لوگو - Black (900)
<h1 className="text-5xl font-black text-neutral-900">Minila</h1>

// عنوان صفحه - ExtraBold (800)
<h1 className="text-3xl font-extrabold text-neutral-900 mb-2">عنوان صفحه</h1>

// عنوان کارت - Bold (700)
<h2 className="text-xl font-bold text-neutral-900">عنوان کارت</h2>

// عنوان بخش - SemiBold (600)
<h3 className="text-lg font-semibold text-neutral-900">عنوان بخش</h3>

// لیبل/دکمه - Medium (500)
<label className="font-medium text-neutral-700">لیبل</label>

// متن اصلی - Regular (400)
<p className="text-neutral-700">متن معمولی</p>

// توضیحات - Light (300)
<p className="text-neutral-600 font-light">توضیحات کمکی</p>
```

---

## 📏 فاصله‌گذاری (Spacing)

### سیستم 4px
تمام فاصله‌ها مضرب 4px هستند.

| Token | مقدار | کاربرد |
|-------|-------|--------|
| `0.5` | 2px | فاصله خیلی کم |
| `1` | 4px | فاصله بین آیکون و متن |
| `1.5` | 6px | padding کوچک |
| `2` | 8px | **gap استاندارد** |
| `3` | 12px | gap متوسط |
| `4` | 16px | **padding کارت** |
| `5` | 20px | فاصله بخش‌ها |
| `6` | 24px | **padding بزرگ** |
| `8` | 32px | margin بین بخش‌ها |

### الگوهای فاصله‌گذاری

```tsx
// padding کامپوننت‌ها
<Card className="p-4">     // 16px - پیش‌فرض
<Card className="p-6">     // 24px - بزرگ‌تر

// gap بین آیتم‌ها
<div className="gap-2">    // 8px - کوچک
<div className="gap-3">    // 12px - متوسط
<div className="gap-4">    // 16px - بزرگ

// margin بین بخش‌ها
<section className="mb-6"> // 24px
<section className="mb-8"> // 32px
```

---

## 🎭 سایه‌ها و گوشه‌ها

### سایه‌ها (Shadows)

| Token | مقدار | کاربرد |
|-------|-------|--------|
| `shadow-soft` | `0 2px 8px rgba(0,0,0,0.04)` | کارت‌های خفیف |
| `shadow-medium` | `0 4px 16px rgba(0,0,0,0.08)` | **کارت‌های اصلی** |
| `shadow-strong` | `0 8px 32px rgba(0,0,0,0.12)` | Modal، dropdown |

```tsx
<Card variant="elevated">  // shadow-medium
<div className="shadow-strong">  // dropdown menu
```

### گوشه‌ها (Border Radius)

| Token | مقدار | کاربرد |
|-------|-------|--------|
| `rounded` | 4px | input، badge |
| `rounded-lg` | 8px | دکمه‌ها |
| `rounded-xl` | 12px | **کارت‌ها** |
| `rounded-2xl` | 16px | کارت‌های بزرگ |
| `rounded-full` | 9999px | آواتار، badge دایره |

---

## 📱 Breakpoints و Responsive

### نقاط شکست

| نام | عرض | پیشوند Tailwind |
|-----|-----|-----------------|
| Mobile | < 640px | (default) |
| Tablet | 640px - 1024px | `sm:` |
| Desktop | > 1024px | `lg:` |
| Wide | > 1280px | `xl:` |

### قوانین Mobile-First

```tsx
// ❌ اشتباه - Desktop-First
<div className="flex-row sm:flex-col">

// ✅ صحیح - Mobile-First
<div className="flex-col sm:flex-row">
```

### الگوی Container

```tsx
// Container استاندارد
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### الگوهای Responsive Grid

```tsx
// Grid کارت‌ها
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

// Grid آمار
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Sidebar + Content
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <aside className="lg:col-span-1">فیلتر</aside>
  <main className="lg:col-span-3">محتوا</main>
</div>
```

### الگوی Responsive List Item

```tsx
// لیست آیتم‌ها با اکشن
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
  {/* محتوای اصلی */}
  <div className="flex items-center gap-3">
    <Avatar />
    <div>
      <p className="font-medium">نام</p>
      <p className="text-sm text-neutral-600">توضیح</p>
    </div>
  </div>
  
  {/* اکشن‌ها */}
  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
    <Badge>وضعیت</Badge>
    <Button size="sm">اکشن</Button>
  </div>
</div>
```

---

## 🧩 کامپوننت‌ها

### Button

| Variant | کاربرد |
|---------|--------|
| `primary` | اکشن اصلی (تأیید، ارسال) |
| `secondary` | اکشن ثانویه (فیلتر، انتخاب) |
| `ghost` | اکشن سوم (لغو، بازگشت) |

| Size | padding | font-size |
|------|---------|-----------|
| `sm` | `px-3 py-1.5` | `text-sm` |
| `md` | `px-4 py-2.5` | `text-base` |
| `lg` | `px-6 py-3` | `text-lg` |

```tsx
<Button variant="primary" size="md">تأیید</Button>
<Button variant="ghost" size="sm">انصراف</Button>
```

### Card

| Variant | استایل |
|---------|--------|
| `default` | فقط پس‌زمینه سفید |
| `bordered` | با بوردر `neutral-200` |
| `elevated` | با سایه + hover effect |

```tsx
<Card variant="bordered" className="p-6">محتوا</Card>
```

### Badge

| Variant | رنگ | کاربرد |
|---------|-----|--------|
| `success` | سبز | تأیید شده، فعال |
| `warning` | زرد | در انتظار، هشدار |
| `error` | قرمز | رد شده، خطا |
| `info` | آبی | اطلاعات |
| `neutral` | خاکستری | پیش‌فرض |

```tsx
<Badge variant="success">تأیید شده</Badge>
<Badge variant="warning">در انتظار</Badge>
```

### Input / Textarea

```tsx
<Input
  label="ایمیل"
  placeholder="example@email.com"
  error="ایمیل نامعتبر است"
  helperText="ایمیل خود را وارد کنید"
/>
```

### Modal

| Size | عرض |
|------|-----|
| `sm` | 400px |
| `md` | 500px |
| `lg` | 600px |
| `xl` | 800px |

```tsx
<Modal isOpen={true} onClose={close} title="عنوان" size="md">
  محتوا
</Modal>
```

### Tabs

```tsx
<Tabs
  tabs={[
    { id: 'tab1', label: 'تب اول', count: 5 },
    { id: 'tab2', label: 'تب دوم' },
  ]}
  activeTab="tab1"
  onChange={setActiveTab}
>
  {/* محتوای تب */}
</Tabs>
```

### Toast

| Variant | کاربرد |
|---------|--------|
| `success` | عملیات موفق |
| `error` | خطا |
| `warning` | هشدار |
| `info` | اطلاعات |

```tsx
showToast('success', 'با موفقیت ذخیره شد')
showToast('error', 'خطایی رخ داد')
```

### EmptyState

```tsx
<EmptyState
  icon={<IconComponent />}
  title="عنوان"
  description="توضیحات"
  action={<Button>اکشن</Button>}
/>
```

### LoadingSpinner

```tsx
<LoadingSpinner size="sm" />  // 16px
<LoadingSpinner size="md" />  // 24px
<LoadingSpinner size="lg" />  // 32px
```

---

## 📐 الگوهای Layout

### Page Layout

```tsx
<div className="min-h-screen bg-neutral-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
        عنوان صفحه
      </h1>
      <p className="text-neutral-600 font-light">
        توضیحات صفحه
      </p>
    </div>
    
    {/* Content */}
    <main>...</main>
  </div>
</div>
```

### Back Button Pattern

```tsx
<Link
  href="/back-path"
  className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
  بازگشت
</Link>
```

### Form Layout

```tsx
<form className="space-y-4">
  <div>
    <Input label="فیلد ۱" />
  </div>
  <div>
    <Input label="فیلد ۲" />
  </div>
  <Button type="submit" className="w-full">ارسال</Button>
</form>
```

### List Item Layout (Responsive)

```tsx
// برای لیست‌هایی که در موبایل باید stack شوند
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50">
  {/* بخش اطلاعات */}
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
      <span className="text-primary-600 font-bold">ن</span>
    </div>
    <div>
      <p className="font-medium text-neutral-900">نام کاربر</p>
      <p className="text-sm text-neutral-600 font-light">توضیحات</p>
    </div>
  </div>
  
  {/* بخش اکشن‌ها */}
  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
    <Badge variant="neutral">وضعیت</Badge>
    <Button size="sm" variant="secondary">اکشن</Button>
  </div>
</div>
```

---

## 🎨 آیکون‌ها

### منبع آیکون‌ها
Heroicons (outline style)

### اندازه‌های استاندارد

| سایز | کلاس | کاربرد |
|------|------|--------|
| 16px | `w-4 h-4` | درون دکمه کوچک |
| 20px | `w-5 h-5` | **درون دکمه معمولی** |
| 24px | `w-6 h-6` | آیکون بزرگ |
| 40px | `w-10 h-10` | آیکون کارت |
| 64px | `w-16 h-16` | Empty state |

### استفاده

```tsx
// آیکون در دکمه
<Button>
  <svg className="w-5 h-5 ml-2">...</svg>
  متن دکمه
</Button>

// آیکون تنها
<button className="p-2 rounded-lg hover:bg-neutral-100">
  <svg className="w-5 h-5 text-neutral-600">...</svg>
</button>
```

---

## ✨ انیمیشن‌ها

### Transition استاندارد

```tsx
// همه کامپوننت‌های تعاملی
<div className="transition-all">
<div className="transition-colors">
```

### Loading Spinner

```tsx
<svg className="animate-spin h-4 w-4">...</svg>
```

### Hover Effects

```tsx
// کارت
<Card className="hover:shadow-strong transition-all">

// دکمه
<button className="hover:bg-neutral-100 transition-colors">

// لینک
<a className="hover:text-primary-600 transition-colors">
```

---

## ♿ دسترسی‌پذیری (Accessibility)

### چک‌لیست

- [x] Semantic HTML (استفاده از تگ‌های صحیح)
- [x] ARIA labels برای screen readers
- [x] Keyboard navigation (Tab, Enter, Escape)
- [x] Focus states واضح
- [x] Color contrast مناسب (WCAG 2.1 AA)
- [x] Text alternatives برای آیکون‌ها

### Focus State

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
```

### Screen Reader

```tsx
<button aria-label="بستن">
  <svg aria-hidden="true">...</svg>
</button>
```

---

## 📋 چک‌لیست طراحی صفحه جدید

### قبل از شروع
- [ ] Mobile-First: ابتدا موبایل را طراحی کن
- [ ] Layout: از max-w-7xl و px-4 sm:px-6 lg:px-8 استفاده کن
- [ ] RTL: جهت متن و layout را بررسی کن

### کامپوننت‌ها
- [ ] از کامپوننت‌های موجود استفاده کن
- [ ] Variants صحیح را انتخاب کن
- [ ] Sizes مناسب را استفاده کن

### Responsive
- [ ] در موبایل (< 640px) تست کن
- [ ] در تبلت (640-1024px) تست کن
- [ ] در دسکتاپ (> 1024px) تست کن

### تعاملات
- [ ] Loading states داشته باش
- [ ] Error states داشته باش
- [ ] Empty states داشته باش
- [ ] Toast برای feedback استفاده کن

### دسترسی‌پذیری
- [ ] Keyboard navigation تست کن
- [ ] Focus states بررسی کن
- [ ] Screen reader تست کن (اختیاری)

---

## 📁 فایل‌های مرتبط

- **فونت‌ها**: `public/fonts/*.woff`
- **CSS پایه**: `src/app/globals.css`
- **تنظیمات Tailwind**: `tailwind.config.js`
- **کامپوننت‌ها**: `src/components/`
- **راهنمای تایپوگرافی**: `TYPOGRAPHY_GUIDE.md`

---

**تهیه شده برای تیم توسعه Minila**

