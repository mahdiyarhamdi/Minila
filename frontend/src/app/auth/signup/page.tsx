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
const signupSchema = z.object({
  email: z.string().email('لطفاً یک ایمیل معتبر وارد کنید'),
  password: z.string().min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد'),
  confirm_password: z.string(),
  first_name: z.string().min(1, 'نام الزامی است'),
  last_name: z.string().min(1, 'نام خانوادگی الزامی است'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'رمز عبور و تکرار آن یکسان نیستند',
  path: ['confirm_password'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError('')
      await apiService.signup({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      })
      setSuccess(true)
      
      // بعد از 2 ثانیه به صفحه لاگین بروید
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-sand-50 to-primary-50">
      {/* لوگو و عنوان */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Minila</h1>
        <p className="text-neutral-600">پلتفرم هماهنگی مسافر و بار</p>
      </div>

      {/* کارت اصلی */}
      <Card variant="elevated" className="w-full max-w-md p-8">
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">ثبت‌نام موفق!</h2>
            <p className="text-neutral-600">
              حساب شما با موفقیت ایجاد شد. در حال انتقال به صفحه ورود...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">ساخت حساب کاربری</h2>
            <p className="text-neutral-600 mb-6">
              برای شروع، اطلاعات خود را وارد کنید.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('first_name')}
                  label="نام"
                  type="text"
                  placeholder="علی"
                  error={errors.first_name?.message}
                />
                <Input
                  {...register('last_name')}
                  label="نام خانوادگی"
                  type="text"
                  placeholder="احمدی"
                  error={errors.last_name?.message}
                />
              </div>

              <Input
                {...register('email')}
                label="آدرس ایمیل"
                type="email"
                placeholder="example@gmail.com"
                error={errors.email?.message}
                dir="ltr"
              />

              <Input
                {...register('password')}
                label="رمز عبور"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                helperText="حداقل 8 کاراکتر"
              />

              <Input
                {...register('confirm_password')}
                label="تکرار رمز عبور"
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
                ثبت‌نام
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600">
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <a
                  href="/auth/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  وارد شوید
                </a>
              </p>
            </div>
          </>
        )}
      </Card>

      {/* فوتر */}
      <p className="mt-8 text-sm text-neutral-500 text-center">
        با ثبت‌نام، شما{' '}
        <a href="#" className="text-primary-600 hover:underline">
          قوانین و مقررات
        </a>{' '}
        را می‌پذیرید.
      </p>
    </div>
  )
}

