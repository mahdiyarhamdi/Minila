'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import LanguageSelector from '@/components/LanguageSelector'
import Logo from '@/components/Logo'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { translateError } from '@/lib/errorTranslation'

type OTPFormData = { otp_code: string }

export default function VerifyEmailPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  // Schema برای validation
  const otpSchema = z.object({
    otp_code: z.string().length(6, t('auth.validation.otpLength')),
  })

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // اگر ایمیل در URL نیست، برگرد به صفحه ثبت‌نام
      router.push('/auth/signup')
    }
  }, [searchParams, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  // تایید OTP
  const onSubmit = async (data: OTPFormData) => {
    try {
      setError('')
      const tokens = await apiService.verifyEmail({
        email,
        otp_code: data.otp_code,
      })
      await login(tokens.access_token, tokens.refresh_token)
      router.push('/dashboard')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || ''
      setError(translateError(errorMsg, t, t('errors.generic')))
    }
  }

  // ارسال مجدد OTP
  const handleResendOTP = async () => {
    try {
      setResendLoading(true)
      setResendMessage('')
      setError('')
      setResendMessage(t('auth.otp.resendSuccess'))
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || ''
      setError(translateError(errorMsg, t, t('errors.generic')))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-4 bg-gradient-to-br from-neutral-50 via-sand-50 to-primary-50 relative">
      {/* Language Selector */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-10">
        <LanguageSelector />
      </div>

      {/* Logo */}
      <div className="text-center mb-6 sm:mb-8">
        <Logo variant="full" size="lg" className="mx-auto mb-2" href="/" />
        <p className="text-sm sm:text-base text-neutral-600 font-light">{t('app.tagline')}</p>
      </div>

      {/* Main Card */}
      <Card variant="elevated" className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-neutral-600 hover:text-neutral-900 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('auth.otp.title')}</h2>
        <p className="text-neutral-600 font-light mb-6">
          {t('auth.otp.subtitle', { email })}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('otp_code')}
            label={t('auth.otp.codeLabel')}
            type="text"
            placeholder={t('auth.otp.codePlaceholder')}
            maxLength={6}
            error={errors.otp_code?.message}
            dir="ltr"
            className="text-center text-2xl tracking-widest"
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {resendMessage && (
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-200">
              <p className="text-sm text-primary-600">{resendMessage}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            {t('auth.otp.submitButton')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={handleResendOTP}
            isLoading={resendLoading}
          >
            {t('auth.otp.resendButton')}
          </Button>
        </form>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-neutral-500 text-center font-light">
        {t('auth.signup.termsNotice')}{' '}
        <a href="/terms" className="text-primary-600 hover:underline font-normal">
          {t('auth.login.termsLink')}
        </a>
      </p>
    </div>
  )
}

