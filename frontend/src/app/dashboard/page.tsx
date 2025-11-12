'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import { apiService } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  // State برای فرم تغییر رمز عبور
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('لطفاً همه فیلدها را پر کنید')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('رمز عبور جدید باید حداقل 8 کاراکتر باشد')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError('رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد')
      return
    }

    setPasswordLoading(true)

    try {
      await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })

      setPasswordSuccess('رمز عبور با موفقیت تغییر کرد')
      // پاک کردن فیلدها
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'خطا در تغییر رمز عبور'
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-neutral-900 mb-2">
            خوش آمدید، {user.first_name}!
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

        {/* تغییر رمز عبور */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">تغییر رمز عبور</h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="old-password" className="block text-sm font-medium text-neutral-700 mb-2">
                رمز عبور فعلی
              </label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="رمز عبور فعلی خود را وارد کنید"
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 mb-2">
                رمز عبور جدید
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل 8 کاراکتر"
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-2">
                تکرار رمز عبور جدید
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="رمز عبور جدید را دوباره وارد کنید"
                disabled={passwordLoading}
              />
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 font-medium">{passwordSuccess}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={passwordLoading}
              className="w-full"
            >
              {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}

