'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import LanguageSelector from '@/components/LanguageSelector'
import Logo from '@/components/Logo'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { translateError } from '@/lib/errorTranslation'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t, language } = useTranslation()
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  // Schemas with translated messages
  const emailSchema = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
  })

  const passwordSchema = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    password: z.string().min(8, t('auth.validation.passwordMin')),
  })

  const otpSchema = z.object({
    otp_code: z.string().length(6, t('auth.validation.otpLength')),
  })

  type EmailFormData = z.infer<typeof emailSchema>
  type PasswordFormData = z.infer<typeof passwordSchema>
  type OTPFormData = z.infer<typeof otpSchema>

  // فرم ورود با password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // فرم ایمیل برای OTP
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail, isSubmitting: isSubmittingEmail },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // فرم OTP
  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: errorsOTP, isSubmitting: isSubmittingOTP },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  // ورود با password
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setError('')
      const tokens = await apiService.loginWithPassword({
        email: data.email,
        password: data.password,
      })
      await login(tokens.access_token, tokens.refresh_token)
      
      // دریافت پروفایل برای بررسی ادمین بودن
      const profile = await apiService.getProfile()
      if (profile.is_admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || ''
      setError(translateError(errorMsg, t, t('auth.validation.invalidCredentials')))
    }
  }

  // درخواست OTP
  const onSubmitEmail = async (data: EmailFormData) => {
    try {
      setError('')
      await apiService.requestOTP({ email: data.email, language: language })
      setEmail(data.email)
      setStep('otp')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || ''
      setError(translateError(errorMsg, t, t('errors.generic')))
    }
  }

  // تایید OTP
  const onSubmitOTP = async (data: OTPFormData) => {
    try {
      setError('')
      const tokens = await apiService.verifyOTP({
        email,
        otp_code: data.otp_code,
      })
      await login(tokens.access_token, tokens.refresh_token)
      
      // دریافت پروفایل برای بررسی ادمین بودن
      const profile = await apiService.getProfile()
      if (profile.is_admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || ''
      setError(translateError(errorMsg, t, t('errors.generic')))
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
        {step === 'otp' ? (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep('form')}
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

            <form onSubmit={handleSubmitOTP(onSubmitOTP)} className="space-y-4">
              <Input
                {...registerOTP('otp_code')}
                label={t('auth.otp.codeLabel')}
                type="text"
                inputMode="numeric"
                placeholder={t('auth.otp.codePlaceholder')}
                maxLength={6}
                error={errorsOTP.otp_code?.message}
                dir="ltr"
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
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
                {t('auth.otp.submitButton')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => onSubmitEmail({ email })}
              >
                {t('auth.otp.resendButton')}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('auth.login.title')}</h2>
            <p className="text-neutral-600 font-light mb-6">
              {t('auth.login.subtitle')}
            </p>

            {/* Login Method Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t('auth.login.passwordTab')}
              </button>
              <button
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  loginMethod === 'otp'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t('auth.login.otpTab')}
              </button>
            </div>

            {/* Password Login Form */}
            {loginMethod === 'password' ? (
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <Input
                  {...registerPassword('email')}
                  label={t('auth.login.emailLabel')}
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  error={errorsPassword.email?.message}
                  dir="ltr"
                />

                <Input
                  {...registerPassword('password')}
                  label={t('auth.login.passwordLabel')}
                  type="password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  error={errorsPassword.password?.message}
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
                  isLoading={isSubmittingPassword}
                >
                  {t('auth.login.submitPassword')}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
                <Input
                  {...registerEmail('email')}
                  label={t('auth.login.emailLabel')}
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
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
                  {t('auth.login.submitOtp')}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600 font-normal">
                {t('auth.login.noAccount')}{' '}
                <a
                  href="/auth/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('auth.login.signupLink')}
                </a>
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-neutral-500 text-center font-light">
        {t('auth.login.termsNotice')}{' '}
        <a href="/terms" className="text-primary-600 hover:underline font-normal">
          {t('auth.login.termsLink')}
        </a>
      </p>
    </div>
  )
}
