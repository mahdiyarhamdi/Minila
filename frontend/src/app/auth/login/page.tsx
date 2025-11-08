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

// Schemas برای validation
const loginSchema = z.object({
  email: z.string().email('لطفاً یک ایمیل معتبر وارد کنید'),
})

const otpSchema = z.object({
  otp_code: z.string().length(6, 'کد OTP باید 6 رقم باشد'),
})

type LoginFormData = z.infer<typeof loginSchema>
type OTPFormData = z.infer<typeof otpSchema>

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  // فرم ایمیل
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail, isSubmitting: isSubmittingEmail },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // فرم OTP
  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: errorsOTP, isSubmitting: isSubmittingOTP },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  // درخواست OTP
  const onSubmitEmail = async (data: LoginFormData) => {
    try {
      setError('')
      await apiService.requestOTP({ email: data.email })
      setEmail(data.email)
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    }
  }

  // تایید OTP
  const onSubmitOTP = async (data: OTPFormData) => {
    try {
      setError('')
      await apiService.verifyOTP({
        email,
        otp_code: data.otp_code,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'کد OTP نامعتبر است.')
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
        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">ورود به حساب</h2>
            <p className="text-neutral-600 mb-6">
              ایمیل خود را وارد کنید تا کد تایید برای شما ارسال شود.
            </p>

            <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
              <Input
                {...registerEmail('email')}
                label="آدرس ایمیل"
                type="email"
                placeholder="example@gmail.com"
                error={errorsEmail.email?.message}
                dir="ltr"
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
                isLoading={isSubmittingEmail}
              >
                ارسال کد تایید
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600">
                حساب کاربری ندارید؟{' '}
                <a
                  href="/auth/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  ثبت‌نام کنید
                </a>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep('email')}
                className="text-neutral-600 hover:text-neutral-900 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                بازگشت
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">کد تایید را وارد کنید</h2>
            <p className="text-neutral-600 mb-6">
              کد 6 رقمی ارسال شده به <span className="font-medium" dir="ltr">{email}</span> را وارد کنید.
            </p>

            <form onSubmit={handleSubmitOTP(onSubmitOTP)} className="space-y-4">
              <Input
                {...registerOTP('otp_code')}
                label="کد تایید"
                type="text"
                placeholder="123456"
                maxLength={6}
                error={errorsOTP.otp_code?.message}
                dir="ltr"
                className="text-center text-2xl tracking-widest"
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
                isLoading={isSubmittingOTP}
              >
                تایید و ورود
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => onSubmitEmail({ email })}
              >
                ارسال مجدد کد
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* فوتر */}
      <p className="mt-8 text-sm text-neutral-500 text-center">
        با ورود به سیستم، شما{' '}
        <a href="#" className="text-primary-600 hover:underline">
          قوانین و مقررات
        </a>{' '}
        را می‌پذیرید.
      </p>
    </div>
  )
}

