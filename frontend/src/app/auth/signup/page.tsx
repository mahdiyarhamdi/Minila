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
import { useTranslation } from '@/hooks/useTranslation'
import { translateError } from '@/lib/errorTranslation'

export default function SignupPage() {
  const router = useRouter()
  const { t, language } = useTranslation()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Schema with translated messages
  const signupSchema = z.object({
    email: z.string().email(t('auth.validation.emailRequired')),
    password: z.string()
      .min(8, t('auth.validation.passwordMin'))
      .regex(/\d/, t('auth.validation.passwordNumber')),
    confirm_password: z.string(),
    first_name: z.string().min(1, t('auth.validation.firstNameRequired')),
    last_name: z.string().min(1, t('auth.validation.lastNameRequired')),
  }).refine((data) => data.password === data.confirm_password, {
    message: t('auth.validation.passwordMatch'),
    path: ['confirm_password'],
  })

  type SignupFormData = z.infer<typeof signupSchema>

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
        language: language,
      })
      setSuccess(true)
      
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
      }, 1500)
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
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('auth.signup.success')}</h2>
            <p className="text-neutral-600 font-light">
              {t('auth.signup.successMessage')}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('auth.signup.title')}</h2>
            <p className="text-neutral-600 font-light mb-6">
              {t('auth.signup.subtitle')}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  {...register('first_name')}
                  label={t('auth.signup.firstNameLabel')}
                  type="text"
                  placeholder={t('auth.signup.firstNamePlaceholder')}
                  error={errors.first_name?.message}
                />
                <Input
                  {...register('last_name')}
                  label={t('auth.signup.lastNameLabel')}
                  type="text"
                  placeholder={t('auth.signup.lastNamePlaceholder')}
                  error={errors.last_name?.message}
                />
              </div>

              <Input
                {...register('email')}
                label={t('auth.signup.emailLabel')}
                type="email"
                placeholder="example@gmail.com"
                error={errors.email?.message}
                dir="ltr"
              />

              <Input
                {...register('password')}
                label={t('auth.signup.passwordLabel')}
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                helperText={t('auth.signup.passwordHelper')}
              />

              <Input
                {...register('confirm_password')}
                label={t('auth.signup.confirmPasswordLabel')}
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
                {t('auth.signup.submitButton')}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-center text-sm text-neutral-600 font-normal">
                {t('auth.signup.hasAccount')}{' '}
                <a
                  href="/auth/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('auth.signup.loginLink')}
                </a>
              </p>
            </div>
          </>
        )}
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
