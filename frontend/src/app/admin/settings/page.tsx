'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminSettings } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiService.getAdminSettings()
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('خطا در بارگذاری تنظیمات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">تنظیمات سیستم</h1>
        <p className="text-neutral-600 mt-1">مشاهده تنظیمات و وضعیت سرویس‌ها</p>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">اطلاعات سیستم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500 mb-1">نسخه اپلیکیشن</p>
            <p className="text-lg font-semibold text-neutral-900">{settings.app_version}</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500 mb-1">محیط اجرا</p>
            <p className="text-lg font-semibold text-neutral-900">
              {settings.environment === 'production' ? 'تولید' : 
               settings.environment === 'development' ? 'توسعه' : 
               settings.environment === 'staging' ? 'آزمایشی' : settings.environment}
            </p>
          </div>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">تنظیمات ایمیل (SMTP)</h2>
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full",
            settings.smtp_configured
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}>
            {settings.smtp_configured ? 'فعال' : 'غیرفعال'}
          </span>
        </div>
        
        {settings.smtp_configured ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">سرویس ایمیل به درستی پیکربندی شده است</span>
            </div>
            {settings.smtp_host && (
              <p className="text-sm text-neutral-600">
                سرور: <span className="font-mono text-neutral-900" dir="ltr">{settings.smtp_host}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">سرویس ایمیل پیکربندی نشده است</span>
          </div>
        )}
      </div>

      {/* Redis Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Redis (Rate Limiting)</h2>
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full",
            settings.redis_configured
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          )}>
            {settings.redis_configured ? 'فعال' : 'حافظه محلی'}
          </span>
        </div>
        
        {settings.redis_configured ? (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">Redis به درستی متصل است</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">Redis متصل نیست، از حافظه محلی استفاده می‌شود</span>
          </div>
        )}
      </div>

      {/* Rate Limits */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">محدودیت‌ها</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-neutral-900">محدودیت پیام روزانه</p>
              <p className="text-sm text-neutral-500">حداکثر تعداد پیام در روز برای هر کاربر</p>
            </div>
            <span className="text-2xl font-bold text-primary-600">
              {settings.messages_per_day_limit.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">توجه</p>
            <p>برای تغییر تنظیمات، فایل‌های محیطی سرور (.env) را ویرایش کنید و سرویس را مجدداً راه‌اندازی نمایید.</p>
          </div>
        </div>
      </div>
    </div>
  )
}




