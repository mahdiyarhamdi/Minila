/**
 * استخراج پیام خطا از response های API
 * 
 * FastAPI می‌تواند خطاها را به صورت‌های مختلف برگرداند:
 * - { detail: "error message" }
 * - { detail: [{ type, loc, msg, input }] } (validation errors)
 * - یا خطاهای دیگر
 */
export function extractErrorMessage(error: any): string {
  // اگر خطا وجود نداشت
  if (!error) {
    return 'خطای نامشخص'
  }

  // اگر مستقیماً یک رشته باشد
  if (typeof error === 'string') {
    return error
  }

  // اگر response.data.detail وجود داشته باشد
  const detail = error?.response?.data?.detail

  if (detail) {
    // اگر detail یک رشته باشد
    if (typeof detail === 'string') {
      return detail
    }

    // اگر detail یک آرایه از validation errors باشد
    if (Array.isArray(detail) && detail.length > 0) {
      // اولین خطا را برمی‌گردانیم
      const firstError = detail[0]
      if (firstError.msg) {
        return firstError.msg
      }
    }

    // اگر detail یک آبجکت باشد (با msg)
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg
    }
  }

  // اگر message وجود داشته باشد
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // اگر error.message وجود داشته باشد
  if (error?.message) {
    return error.message
  }

  // خطای عمومی بر اساس status code
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'درخواست نامعتبر'
      case 401:
        return 'لطفاً وارد شوید'
      case 403:
        return 'شما اجازه دسترسی ندارید'
      case 404:
        return 'یافت نشد'
      case 409:
        return 'تداخل در داده‌ها'
      case 422:
        return 'داده‌های ورودی نامعتبر'
      case 429:
        return 'شما به محدودیت روزانه رسیده‌اید. لطفاً بعداً دوباره امتحان کنید.'
      case 500:
        return 'خطای سرور'
      default:
        return `خطا: ${error.response.status}`
    }
  }

  return 'خطای نامشخص'
}




