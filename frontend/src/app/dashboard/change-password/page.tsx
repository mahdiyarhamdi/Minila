'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import { apiService } from '@/lib/api'

// Schema برای validation
const changePasswordSchema = z.object({
  old_password: z.string().min(8, 'رمز عبور فعلی باید حداقل 8 کاراکتر باشد'),
  new_password: z.string().min(8, 'رمز عبور جدید باید حداقل 8 کاراکتر باشد'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'رمز عبور جدید و تکرار آن یکسان نیستند',
  path: ['confirm_password'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setError('')
      setSuccess(false)
      
      await apiService.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      })
      
      setSuccess(true)
      reset()
      
      // بعد از 2 ثانیه به dashboard برگرد
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-sand-50 to-primary-50">
      {/* لوگو و عنوان */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-neutral-900 mb-2">Minila</h1>
        <p className="text-neutral-600 font-light text-base">پلتفرم هماهنگی مسافر و بار</p>
      </div>

      {/* کارت اصلی */}
      <Card variant="elevated" className="w-full max-w-md p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-neutral-600 hover:text-neutral-900 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت به داشبورد
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">تغییر رمز عبور موفق!</h2>
            <p className="text-neutral-600 font-light">
              رمز عبور شما با موفقیت تغییر کرد. در حال بازگشت به داشبورد...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">تغییر رمز عبور</h2>
            <p className="text-neutral-600 font-light mb-6">
              برای تغییر رمز عبور، فرم زیر را تکمیل کنید.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('old_password')}
                label="رمز عبور فعلی"
                type="password"
                placeholder="••••••••"
                error={errors.old_password?.message}
              />

              <Input
                {...register('new_password')}
                label="رمز عبور جدید"
                type="password"
                placeholder="••••••••"
                error={errors.new_password?.message}
                helperText="حداقل 8 کاراکتر"
              />

              <Input
                {...register('confirm_password')}
                label="تکرار رمز عبور جدید"
                type="password"
                placeholder="••••••••"
                error={errors.confirm_password?.message}
              />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                تغییر رمز عبور
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* فوتر */}
      <p className="mt-8 text-sm text-neutral-500 text-center font-light">
        رمز عبور خود را به صورت امن نگه‌داری کنید.
      </p>
    </div>
  )
}

