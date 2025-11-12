'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/lib/api'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useToast } from '@/components/Toast'

/**
 * صفحه ویرایش پروفایل
 */
export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'نام الزامی است'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'نام خانوادگی الزامی است'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      showToast('error', 'لطفاً تمام فیلدها را پر کنید')
      return
    }

    setIsLoading(true)

    try {
      await apiService.updateProfile(formData)
      showToast('success', 'پروفایل با موفقیت به‌روزرسانی شد')
      // Refresh user data
      window.location.reload()
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در به‌روزرسانی پروفایل')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
            ویرایش پروفایل
          </h1>
          <p className="text-neutral-600 font-light">
            اطلاعات حساب کاربری خود را مدیریت کنید
          </p>
        </div>

        {/* Profile Form */}
        <Card variant="elevated" className="p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Placeholder */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-extrabold text-3xl">
                  {user.first_name[0]}
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral-600 font-light mb-2">
                  عکس پروفایل (به زودی)
                </p>
                <Button size="sm" variant="secondary" disabled>
                  آپلود عکس
                </Button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="نام *"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                error={errors.first_name}
              />
              <Input
                label="نام خانوادگی *"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                error={errors.last_name}
              />
            </div>

            {/* Email (Read-only) */}
            <Input
              label="ایمیل"
              value={user.email}
              disabled
              helperText="ایمیل قابل تغییر نیست"
            />

            {/* Submit Button */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                انصراف
              </Button>
              <Button type="submit" isLoading={isLoading}>
                ذخیره تغییرات
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Info */}
        <Card variant="bordered" className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            اطلاعات حساب
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">وضعیت ایمیل:</span>
              <span
                className={`font-medium ${
                  user.is_email_verified ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {user.is_email_verified ? 'تایید شده ✓' : 'در انتظار تایید'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">تاریخ عضویت:</span>
              <span className="font-medium text-neutral-900">
                {new Date(user.created_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600 font-light">آخرین به‌روزرسانی:</span>
              <span className="font-medium text-neutral-900">
                {new Date(user.updated_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

