/**
 * Mapping پیام‌های خطای فارسی Backend به کلیدهای ترجمه
 */

// پیام‌های خطای Backend (فارسی) → کلید ترجمه
const ERROR_MAPPINGS: Record<string, string> = {
  // Auth errors
  'این ایمیل قبلاً ثبت شده است': 'errors.api.emailAlreadyExists',
  'ابتدا باید ایمیل خود را تایید کنید': 'errors.api.emailNotVerified',
  'کاربری با این ایمیل یافت نشد': 'errors.api.userNotFound',
  'کد OTP نامعتبر است': 'errors.api.invalidOtp',
  'کد OTP منقضی شده است': 'errors.api.otpExpired',
  'ایمیل یا رمز عبور نادرست است': 'errors.api.invalidCredentials',
  'حساب کاربری شما غیرفعال شده است': 'errors.api.accountDisabled',
  'ایمیل قبلاً تایید شده است': 'errors.api.emailAlreadyVerified',
  'رمز عبور تنظیم نشده است': 'errors.api.passwordNotSet',
  'رمز عبور فعلی نادرست است': 'errors.api.wrongCurrentPassword',
  
  // Message errors
  'نمی‌توانید به خودتان پیام ارسال کنید': 'errors.api.cannotMessageSelf',
  'گیرنده پیام یافت نشد': 'errors.api.receiverNotFound',
  'گیرنده پیام غیرفعال است': 'errors.api.receiverInactive',
  'شما و گیرنده پیام هیچ کامیونیتی مشترکی ندارید': 'errors.api.noCommonCommunity',
  
  // Community errors
  'کامیونیتی یافت نشد': 'errors.api.communityNotFound',
  'شما قبلاً عضو این کامیونیتی هستید': 'errors.api.alreadyMember',
  'شما قبلاً درخواست عضویت داده‌اید': 'errors.api.alreadyRequested',
  'شما قبلاً درخواست عضویت ارسال کرده‌اید': 'errors.api.alreadyRequested',
  
  // Card errors
  'کارت یافت نشد': 'errors.api.cardNotFound',
  'شما مالک این کارت نیستید': 'errors.api.notCardOwner',
  
  // Card validation errors (English from backend)
  'Traveler card requires travel date or time frame': 'errors.api.travelerRequiresDate',
  'Sender card requires a time frame': 'errors.api.senderRequiresTimeFrame',
  'End date must be after start date': 'errors.api.endDateAfterStart',
  
  // Password errors
  'Current password is incorrect': 'errors.api.wrongCurrentPassword',
  
  // API errors
  'Method Not Allowed': 'errors.api.methodNotAllowed',
}

/**
 * ترجمه پیام خطای Backend
 * @param message پیام خطا از Backend
 * @param t تابع ترجمه
 * @param fallback پیام پیش‌فرض در صورت عدم یافتن ترجمه
 */
export function translateError(
  message: string,
  t: (key: string) => string,
  fallback?: string
): string {
  const translationKey = ERROR_MAPPINGS[message]
  
  if (translationKey) {
    return t(translationKey)
  }
  
  // اگر ترجمه‌ای پیدا نشد، پیام اصلی را برگردان
  return fallback || message
}

