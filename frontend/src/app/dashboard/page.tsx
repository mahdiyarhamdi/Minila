'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/Button'
import Card from '@/components/Card'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-black text-neutral-900">Minila</h1>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600 font-medium">
                {user.first_name} {user.last_name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-neutral-900 mb-2">
            خوش آمدید، {user.first_name}! 👋
          </h2>
          <p className="text-neutral-600 font-light text-base">
            از داشبورد خود می‌توانید کارت‌ها را مدیریت کنید و پیام‌های خود را مشاهده کنید.
          </p>
        </div>

        {/* کارت‌های اطلاعاتی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="bordered" className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">کارت‌های من</h3>
            <p className="text-3xl font-extrabold text-primary-600">0</p>
            <p className="text-sm text-neutral-600 font-light mt-2">کارت فعال</p>
          </Card>

          <Card variant="bordered" className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">پیام‌های دریافتی</h3>
            <p className="text-3xl font-extrabold text-sand-400">0</p>
            <p className="text-sm text-neutral-600 font-light mt-2">پیام جدید</p>
          </Card>

          <Card variant="bordered" className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">کامیونیتی‌ها</h3>
            <p className="text-3xl font-extrabold text-neutral-700">0</p>
            <p className="text-sm text-neutral-600 font-light mt-2">عضویت فعال</p>
          </Card>
        </div>

        {/* اکشن‌ها */}
        <Card variant="elevated" className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">شروع سریع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-500 hover:bg-primary-50 transition-all text-right">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-1">ایجاد کارت جدید</h4>
                  <p className="text-sm text-neutral-600 font-light">یک کارت سفر یا بار جدید بسازید</p>
                </div>
              </div>
            </button>

            <button className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-sand-400 hover:bg-sand-50 transition-all text-right">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sand-100">
                  <svg className="w-6 h-6 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-1">پیوستن به کامیونیتی</h4>
                  <p className="text-sm text-neutral-600 font-light">به یک کامیونیتی بپیوندید یا کامیونیتی جدید بسازید</p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        {/* اطلاعات کاربر */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">اطلاعات حساب</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">ایمیل:</span>
              <span className="font-medium text-neutral-900" dir="ltr">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">نام:</span>
              <span className="font-medium text-neutral-900">{user.first_name} {user.last_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">وضعیت ایمیل:</span>
              <span className={`font-medium ${user.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.is_email_verified ? 'تایید شده ✓' : 'در انتظار تایید'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600 font-light">تاریخ عضویت:</span>
              <span className="font-medium text-neutral-900">
                {new Date(user.created_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

